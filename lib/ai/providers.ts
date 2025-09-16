import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { isTestEnvironment } from '../constants';
import { openai } from '@ai-sdk/openai';

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require('./models.mock');
      return customProvider({
        languageModels: {
          'gpt-4o-mini-chat': chatModel,
          'title-model': titleModel,
          'artifact-model': artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        'gpt-4o-mini-chat': openai('gpt-4o-mini'),
        'title-model': openai('gpt-4o-mini'),
        'artifact-model': openai('gpt-4o-mini'),
      },
    });