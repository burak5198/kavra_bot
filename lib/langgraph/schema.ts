import { z } from 'zod';
import { BaseMessage } from '@langchain/core/messages';

// Zod schema for AgentState
export const AgentStateSchema = z.object({
  messages: z.array(z.any()).default([]),
  currentStep: z.string().default('start'),
  userInput: z.string().default(''),
  context: z.record(z.any()).default({}),
  tools: z.array(z.string()).default([]),
  isComplete: z.boolean().default(false),
  chatId: z.string().default(''),
  userId: z.string().default(''),
});

export type AgentState = z.infer<typeof AgentStateSchema>;

// State channels configuration for StateGraph
export const stateChannels = {
  messages: {
    value: (x: any[], y: any[]) => x.concat(y),
    default: () => [],
  },
  currentStep: {
    value: (x: string, y: string) => y ?? x,
    default: () => 'start',
  },
  userInput: {
    value: (x: string, y: string) => y ?? x,
    default: () => '',
  },
  context: {
    value: (x: any, y: any) => ({ ...x, ...y }),
    default: () => ({}),
  },
  tools: {
    value: (x: string[], y: string[]) => y ?? x,
    default: () => [],
  },
  isComplete: {
    value: (x: boolean, y: boolean) => y ?? x,
    default: () => false,
  },
  chatId: {
    value: (x: string, y: string) => y ?? x,
    default: () => '',
  },
  userId: {
    value: (x: string, y: string) => y ?? x,
    default: () => '',
  },
};
