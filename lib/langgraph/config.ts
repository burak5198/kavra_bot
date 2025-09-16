import { ChatOpenAI } from '@langchain/openai';
import { BaseLanguageModel } from '@langchain/core/language_models/base';

export interface LangGraphConfig {
  openaiApiKey?: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
}

export function createLangGraphModel(config: LangGraphConfig): BaseLanguageModel {
  if (!config.openaiApiKey) {
    throw new Error('OpenAI API key is required');
  }

  return new ChatOpenAI({
    openAIApiKey: config.openaiApiKey,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    modelName: config.modelName,
    streaming: false, // Disable streaming to avoid token counting issues
    verbose: false,   // Reduce logging
  });
}

export const defaultLangGraphConfig: LangGraphConfig = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4o-mini', // Most cost-effective model
  temperature: 0.7,
  maxTokens: 1000,
};

// Create the default model instance
export const defaultModel = createLangGraphModel(defaultLangGraphConfig);
