import type { DNA, TaskRequest, TaskResponse, TaskContext } from '@bloodline/shared';
import { buildSystemPrompt } from './personality';
import type { PluginManager } from './plugins';

export interface AgentState {
  taskId: string;
  taskType: string;
  payload: Record<string, unknown>;
  context: TaskContext;
  plan: ExecutionStep[];
  steps: StepResult[];
  output: Record<string, unknown>;
  error: string | null;
  status: 'planning' | 'executing' | 'reviewing' | 'completed' | 'failed';
}

export interface ExecutionStep {
  index: number;
  description: string;
  action?: string;
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

/**
 * AgentCore - the agent's brain that plans, executes, reviews, and outputs.
 * DNA modifies system prompt generation. Uses grief boost if present.
 */
export class AgentCore {
  constructor(
    private config: AgentConfig,
    private pluginManager: PluginManager,
  ) {}

  /**
   * Reads task, builds execution plan (list of steps).
   */
  planNode(request: TaskRequest): ExecutionStep[] {
    const { payload, context } = request;
    const steps: ExecutionStep[] = [];

    // Simple heuristic: break down by task type
    if (request.taskType === 'bounty_task') {
      const desc = (payload.description as string) || (payload.title as string) || 'Complete task';
      steps.push({ index: 0, description: `Analyze: ${desc}`, action: 'analyze' });
      steps.push({ index: 1, description: 'Execute main work', action: 'execute' });
      steps.push({ index: 2, description: 'Format output', action: 'format' });
    } else if (request.taskType === 'jury_vote') {
      steps.push({ index: 0, description: 'Review submission', action: 'review' });
      steps.push({ index: 1, description: 'Cast vote with reasoning', action: 'vote' });
    } else {
      steps.push({ index: 0, description: 'Process task', action: 'process' });
    }

    return steps;
  }

  /**
   * Executes the current step.
   */
  async executeNode(
    step: ExecutionStep,
    state: AgentState,
  ): Promise<{ output: unknown; tokensUsed: number; durationMs: number }> {
    const start = Date.now();
    const systemPrompt = this.config.systemPrompt ?? buildSystemPrompt(this.config.dna, this.config.griefBoost);

    // Simulate step execution - in production this would call an LLM
    const output: unknown = {
      step: step.index,
      action: step.action,
      result: `Executed: ${step.description}`,
      systemPromptHint: systemPrompt.slice(0, 100) + '...',
    };

    const durationMs = Date.now() - start;
    const tokensUsed = 0; // Would come from LLM response

    return { output, tokensUsed, durationMs };
  }

  /**
   * Reviews step output, decides continue or done.
   */
  reviewNode(step: ExecutionStep, result: StepResult, plan: ExecutionStep[]): 'continue' | 'done' {
    if (step.index >= plan.length - 1) return 'done';
    return 'continue';
  }

  /**
   * Formats final output.
   */
  outputNode(state: AgentState): Record<string, unknown> {
    const lastStep = state.steps[state.steps.length - 1];
    return {
      taskId: state.taskId,
      result: lastStep?.output ?? state.output,
      stepsCompleted: state.steps.length,
      summary: state.steps.map((s) => s.description).join('; '),
    };
  }

  /**
   * Main execution loop.
   */
  async execute(request: TaskRequest): Promise<TaskResponse> {
    const start = Date.now();
    const plan = this.planNode(request);

    const state: AgentState = {
      taskId: request.taskId,
      taskType: request.taskType,
      payload: request.payload,
      context: request.context,
      plan,
      steps: [],
      output: {},
      error: null,
      status: 'planning',
    };

    state.status = 'executing';
    let totalTokens = 0;

    try {
      for (const step of plan) {
        const { output, tokensUsed, durationMs } = await this.executeNode(step, state);
        totalTokens += tokensUsed;

        const stepResult: StepResult = {
          stepIndex: step.index,
          description: step.description,
          output,
          tokensUsed,
          durationMs,
        };
        state.steps.push(stepResult);

        const decision = this.reviewNode(step, stepResult, plan);
        if (decision === 'done') break;
      }

      state.status = 'completed';
      state.output = this.outputNode(state);

      return {
        taskId: request.taskId,
        status: 'completed',
        output: state.output,
        outputUri: null,
        pluginsUsed: [],
        tokensUsed: totalTokens,
        executionMs: Date.now() - start,
      };
    } catch (err) {
      state.status = 'failed';
      state.error = err instanceof Error ? err.message : String(err);

      return {
        taskId: request.taskId,
        status: 'failed',
        output: { error: state.error },
        outputUri: null,
        pluginsUsed: [],
        tokensUsed: totalTokens,
        executionMs: Date.now() - start,
      };
    }
  }
}
