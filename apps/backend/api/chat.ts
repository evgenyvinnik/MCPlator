import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';
import { calculatorEngine } from '@calculator/calculator-engine';
import type { KeyId, ChatRequestBody, ChatResponseBody } from '@calculator/shared-types';
import { v4 as uuid } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const calculatorPressKeysTool = {
  name: 'calculator_press_keys',
  description: 'Simulate pressing calculator keys in order.',
  input_schema: {
    type: 'object',
    properties: {
      keys: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'digit_0', 'digit_1', 'digit_2', 'digit_3', 'digit_4',
            'digit_5', 'digit_6', 'digit_7', 'digit_8', 'digit_9',
            'decimal',
            'add', 'sub', 'mul', 'div',
            'percent',
            'equals',
            'ac', 'c',
            'mc', 'mr', 'm_plus', 'm_minus',
          ],
        },
      },
    },
    required: ['keys'],
  },
} as const;

const handleCalculatorPressKeys = (keys: KeyId[]) => {
  let state = calculatorEngine.initialState();
  for (const key of keys) {
    state = calculatorEngine.pressKey(state, key);
  }
  const display = calculatorEngine.toDisplay(state);
  return { display, keys };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).end('Method not allowed');
    return;
  }

  const body = req.body as ChatRequestBody;
  const { message, history } = body;

  const systemPrompt = `
You are an assistant controlling a Casio-like calculator UI in the browser.

Rules:
- For any numeric calculator operation, you MUST use the "calculator_press_keys" tool.
- The browser holds the actual calculator state; this tool is for validating key sequences and seeing the resulting display.
- In your final answer to the user, do two things:
  1) Provide a short natural language explanation.
  2) Include at the very end a JSON block like: {"keys":["digit_1","digit_0","digit_0","add","digit_2","equals"]}

If the user request is not a calculator operation, do NOT call the tool and answer normally. In that case, the JSON block must have an empty "keys" array.
`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...(history ?? []).map((m) => ({
      role: m.role,
      content: m.text,
    })),
    { role: 'user' as const, content: message },
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // or gpt-5-mini, depending on what you pick
    messages,
    tools: [{ type: 'function', function: calculatorPressKeysTool }],
  });

  // Pseudo-code parsing; adjust to actual Responses API structure.
  let assistantText = '';
  let keys: KeyId[] = [];

  const choice = response.choices[0];
  const messageContent = choice.message.content;
  const toolCalls = choice.message.tool_calls;

  if (messageContent) {
      assistantText = messageContent;
  }

  if (toolCalls) {
      for (const toolCall of toolCalls) {
          if (toolCall.function.name === 'calculator_press_keys') {
              const args = JSON.parse(toolCall.function.arguments) as { keys: KeyId[] };
              const toolResult = handleCalculatorPressKeys(args.keys);
              keys = toolResult.keys;
          }
      }
  }
  
  // Also check for the JSON block at the end of the text as per prompt instructions, 
  // although the tool usage is preferred. The prompt says:
  // "Include at the very end a JSON block like: {"keys":...}"
  // But we are using tools. The prompt instructions seem to mix tool usage and text output.
  // The spec code uses `response.output` which looks like a different API (maybe the new Responses API?).
  // I'll stick to standard Chat Completions API for now as `openai` package usually supports it.
  // The spec code:
  /*
  const response = await openai.responses.create({ ... });
  for (const item of response.output) { ... }
  */
  // This looks like a hypothetical or very new API. I will adapt it to standard Chat Completions.
  // However, the prompt asks for a JSON block at the end.
  // If the model follows instructions, it might put JSON in the text.
  // But if it uses the tool, we get the keys from the tool call.
  // I will prioritize the tool call.

  const now = new Date().toISOString();
  const payload: ChatResponseBody = {
    message: {
      id: uuid(),
      role: 'assistant',
      text: assistantText,
      createdAt: now,
    },
    animation: keys.length
      ? {
          id: uuid(),
          commands: keys.map((k) => ({
            type: 'pressKey' as const,
            key: k,
            delayMs: 180,
          })),
        }
      : undefined,
  };

  res.status(200).json(payload);
}
