export const DEFAULT_CHAT_MODEL: string = 'gpt-4o-mini-chat';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'gpt-4o-mini-chat',
    name: 'GPT-4o Mini Chat',
    description: 'GPT-4o-mini powered agent with LangGraph workflow capabilities',
  },
];