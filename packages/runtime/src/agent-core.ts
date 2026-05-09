import { StateGraph, END, Annotation, START } from '@langchain/langgraph';
import type { DNA, TaskRequest, TaskResponse, TaskContext } from '@bloodline/shared';
import { buildSystemPrompt } from './personality';
import type { PluginManager } from './plugins';

export interface ExecutionStep {
  index: number;
  description: string;
  action?: string;
  pluginId?: string;
  pluginAction?: string;
  pluginParams?: Record<string, unknown>;
}

export interface StepResult {
  stepIndex: number;
  description: string;
  output: unknown;
  tokensUsed: number;
  durationMs: number;
}

export interface AgentConfig {
  agentId: string;
  dna: DNA;
  griefBoost: number;
  plugins: string[];
  systemPrompt?: string;
}

const AgentStateAnnotation = Annotation.Root({
  taskId: Annotation<string>,
  taskType: Annotation<string>,
  payload: Annotation<Record<string, unknown>>,
  context: Annotation<TaskContext>,
  systemPrompt: Annotation<string>,
  plan: Annotation<ExecutionStep[]>,
  currentStepIndex: Annotation<number>,
  steps: Annotation<StepResult[]>,
  output: Annotation<Record<string, unknown>>,
  error: Annotation<string | null>,
  status: Annotation<string>,
  totalTokens: Annotation<number>,
  availablePlugins: Annotation<string[]>,
});

type AgentState = typeof AgentStateAnnotation.State;

export class AgentCore {
  private graph: ReturnType<typeof this.buildGraph> | null = null;

  constructor(
    private config: AgentConfig,
    private pluginManager: PluginManager,
  ) {}

  private buildGraph() {
    const self = this;

    const planNode = async (state: AgentState): Promise<Partial<AgentState>> => {
      const steps = self.generatePlan(state);
      return {
        plan: steps,
        currentStepIndex: 0,
        status: 'executing',
      };
    };

    const executeNode = async (state: AgentState): Promise<Partial<AgentState>> => {
      const step = state.plan[state.currentStepIndex];
      if (!step) {
        return { status: 'reviewing', error: 'No step to execute' };
      }

      const start = Date.now();
      let output: unknown;
      let tokensUsed = 0;

      try {
        if (step.pluginId && step.pluginAction) {
          const result = await self.pluginManager.executePlugin(
            step.pluginId,
            step.pluginAction,
            step.pluginParams ?? {},
          );
          if (!result.success) {
            output = { error: result.error ?? 'Plugin execution failed' };
          } else {
            output = result.data;
          }
          tokensUsed = 0;
        } else {
          const result = await self.executeStepWithLLM(step, state);
          output = result.output;
          tokensUsed = result.tokensUsed;
        }
      } catch (err) {
        output = { error: err instanceof Error ? err.message : String(err) };
      }

      const durationMs = Date.now() - start;
      const stepResult: StepResult = {
        stepIndex: step.index,
        description: step.description,
        output,
        tokensUsed,
        durationMs,
      };

      return {
        steps: [...state.steps, stepResult],
        totalTokens: state.totalTokens + tokensUsed,
        status: 'reviewing',
      };
    };

    const reviewNode = async (state: AgentState): Promise<Partial<AgentState>> => {
      const lastStep = state.steps[state.steps.length - 1];

      if (lastStep?.output && typeof lastStep.output === 'object' && 'error' in (lastStep.output as Record<string, unknown>)) {
        const errorOutput = lastStep.output as Record<string, unknown>;
        if (state.currentStepIndex < state.plan.length - 1) {
          return { currentStepIndex: state.currentStepIndex + 1, status: 'executing' };
        }
        return { status: 'failed', error: String(errorOutput.error) };
      }

      if (state.currentStepIndex >= state.plan.length - 1) {
        return { status: 'outputting' };
      }

      return { currentStepIndex: state.currentStepIndex + 1, status: 'executing' };
    };

    const outputNode = async (state: AgentState): Promise<Partial<AgentState>> => {
      const lastStep = state.steps[state.steps.length - 1];
      return {
        output: {
          taskId: state.taskId,
          result: lastStep?.output ?? null,
          stepsCompleted: state.steps.length,
          summary: state.steps.map(s => s.description).join('; '),
          allStepOutputs: state.steps.map(s => ({ step: s.description, output: s.output })),
        },
        status: 'completed',
      };
    };

    const shouldContinue = (state: AgentState): string => {
      switch (state.status) {
        case 'executing': return 'execute';
        case 'reviewing': return 'review';
        case 'outputting': return 'output';
        case 'completed': return END;
        case 'failed': return END;
        default: return END;
      }
    };

    const graph = new StateGraph(AgentStateAnnotation)
      .addNode('plan', planNode)
      .addNode('execute', executeNode)
      .addNode('review', reviewNode)
      .addNode('output', outputNode)
      .addEdge(START, 'plan')
      .addConditionalEdges('plan', shouldContinue)
      .addConditionalEdges('execute', shouldContinue)
      .addConditionalEdges('review', shouldContinue)
      .addEdge('output', END);

    return graph.compile();
  }

  private generatePlan(state: AgentState): ExecutionStep[] {
    const { payload, context } = state;
    const steps: ExecutionStep[] = [];

    if (state.taskType === 'bounty_task') {
      const desc = (payload.description as string) || (payload.title as string) || 'Complete task';

      steps.push({
        index: 0,
        description: `Analyze task requirements: ${desc}`,
        action: 'analyze',
      });

      if (state.availablePlugins.includes('web-browsing-v2')) {
        steps.push({
          index: steps.length,
          description: 'Research relevant information',
          pluginId: 'web-browsing-v2',
          pluginAction: 'search',
          pluginParams: { query: desc },
        });
      }

      steps.push({
        index: steps.length,
        description: 'Execute main task work',
        action: 'execute',
      });

      steps.push({
        index: steps.length,
        description: 'Review and format output',
        action: 'format',
      });

    } else if (state.taskType === 'jury_vote') {
      steps.push({
        index: 0,
        description: 'Analyze submission quality and requirements',
        action: 'analyze_submission',
      });
      steps.push({
        index: 1,
        description: 'Cast vote with detailed reasoning',
        action: 'cast_vote',
      });

    } else if (state.taskType === 'auto_task') {
      steps.push({
        index: 0,
        description: 'Process automated task',
        action: 'auto_process',
      });
    } else {
      steps.push({
        index: 0,
        description: 'Process generic task',
        action: 'process',
      });
    }

    return steps;
  }

  private async executeStepWithLLM(
    step: ExecutionStep,
    state: AgentState,
  ): Promise<{ output: unknown; tokensUsed: number }> {
    const systemPrompt = state.systemPrompt;
    const previousOutputs = state.steps.map(s => `Step ${s.stepIndex}: ${s.description} → ${JSON.stringify(s.output)}`).join('\n');

    const userPrompt = `Task: ${state.taskType}
Payload: ${JSON.stringify(state.payload)}
Current Step: ${step.description}
Previous Results:
${previousOutputs || '(none)'}

Execute this step and provide the result.`;

    const llmApiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;

    if (llmApiKey && process.env.OPENAI_API_KEY) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 2048,
            temperature: 0.7,
          }),
          signal: AbortSignal.timeout(30000),
        });
        if (!res.ok) {
          throw new Error(`OpenAI API returned HTTP ${res.status}`);
        }
        const data = await res.json() as {
          choices?: Array<{ message?: { content?: string } }>;
          usage?: { total_tokens?: number };
        };
        return {
          output: {
            step: step.index,
            action: step.action,
            result: data.choices?.[0]?.message?.content ?? 'No response',
            model: 'gpt-4o-mini',
          },
          tokensUsed: data.usage?.total_tokens ?? 0,
        };
      } catch {
        // Fall through to next provider or simulation
      }
    }

    if (llmApiKey && process.env.ANTHROPIC_API_KEY) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY!,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
            max_tokens: 2048,
          }),
          signal: AbortSignal.timeout(30000),
        });
        if (!res.ok) {
          throw new Error(`Anthropic API returned HTTP ${res.status}`);
        }
        const data = await res.json() as {
          content?: Array<{ text?: string }>;
          usage?: { input_tokens?: number; output_tokens?: number };
        };
        return {
          output: {
            step: step.index,
            action: step.action,
            result: data.content?.[0]?.text ?? 'No response',
            model: 'claude-sonnet-4-20250514',
          },
          tokensUsed: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
        };
      } catch {
        // Fall through to simulation
      }
    }

    return {
      output: {
        step: step.index,
        action: step.action,
        result: `Executed: ${step.description}`,
        mode: 'simulation',
        systemPromptPreview: systemPrompt.slice(0, 120) + '...',
      },
      tokensUsed: 0,
    };
  }

  async execute(request: TaskRequest): Promise<TaskResponse> {
    const start = Date.now();
    const systemPrompt = this.config.systemPrompt ?? buildSystemPrompt(this.config.dna, this.config.griefBoost);

    if (!this.graph) {
      this.graph = this.buildGraph();
    }

    const initialState: AgentState = {
      taskId: request.taskId,
      taskType: request.taskType,
      payload: request.payload,
      context: request.context,
      systemPrompt,
      plan: [],
      currentStepIndex: 0,
      steps: [],
      output: {},
      error: null,
      status: 'planning',
      totalTokens: 0,
      availablePlugins: this.config.plugins,
    };

    try {
      const finalState = await this.graph.invoke(initialState);

      return {
        taskId: request.taskId,
        status: finalState.status === 'completed' ? 'completed' : 'failed',
        output: finalState.output,
        outputUri: null,
        pluginsUsed: finalState.steps
          .filter((s: StepResult) => {
            const step = finalState.plan.find((p: ExecutionStep) => p.index === s.stepIndex);
            return step?.pluginId;
          })
          .map((s: StepResult) => {
            const step = finalState.plan.find((p: ExecutionStep) => p.index === s.stepIndex);
            return step?.pluginId ?? '';
          })
          .filter(Boolean),
        tokensUsed: finalState.totalTokens,
        executionMs: Date.now() - start,
      };
    } catch (err) {
      return {
        taskId: request.taskId,
        status: 'failed',
        output: { error: err instanceof Error ? err.message : String(err) },
        outputUri: null,
        pluginsUsed: [],
        tokensUsed: 0,
        executionMs: Date.now() - start,
      };
    }
  }
}
