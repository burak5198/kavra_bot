import { BaseMessage } from '@langchain/core/messages';

export interface AgentState {
  messages: BaseMessage[];
  currentStep: string;
  userInput: string;
  context: Record<string, any>;
  tools: string[];
  isComplete: boolean;
  chatId: string;
  userId: string;
}

export const initialAgentState: Partial<AgentState> = {
  messages: [],
  currentStep: 'start',
  userInput: '',
  context: {},
  tools: [],
  isComplete: false,
  chatId: '',
  userId: '',
};
