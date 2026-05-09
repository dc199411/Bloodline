const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';

async function callOpenAI(prompt: string, systemPrompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 512,
      temperature: 0.9,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function callAnthropic(prompt: string, systemPrompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 512,
      temperature: 0.9,
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

export async function generateText(prompt: string, systemPrompt: string): Promise<string> {
  if (OPENAI_API_KEY) {
    try {
      return await callOpenAI(prompt, systemPrompt);
    } catch (err) {
      console.error('[LLM] OpenAI failed, trying Anthropic fallback:', err);
    }
  }

  if (ANTHROPIC_API_KEY) {
    return await callAnthropic(prompt, systemPrompt);
  }

  throw new Error('No LLM API key configured (OPENAI_API_KEY or ANTHROPIC_API_KEY)');
}
