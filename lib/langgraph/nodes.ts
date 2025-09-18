import { AgentState } from './state';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { createLangGraphModel, defaultLangGraphConfig } from './config';
import { judgeIntent } from './intent';

export async function processUserInput(state: AgentState) {
  // Simply add the user input to messages and move to intent analysis
  const userMessage = new HumanMessage(state.userInput);
  
  return {
    messages: [...state.messages, userMessage],
    currentStep: 'analyze_intent',
    context: {
      ...state.context,
      lastUserMessage: state.userInput,
    },
  };
}

export async function analyzeIntent(state: AgentState) {
  // Semantic domain classification in Turkish
  let intent = 'general';
  let needsTool = false;
  let suggestedTools: string[] = [];
  let isOutOfScope = false;

  const original = state.userInput;
  const lower = original.toLowerCase();

  const { label } = await judgeIntent(original);
  isOutOfScope = label === 'out_of_scope';

  if (!isOutOfScope) {
    if (lower.includes('hava') || lower.includes('hava durumu') || lower.includes('weather')) {
      intent = 'weather';
      needsTool = true;
      suggestedTools = ['weather'];
    } else if (lower.includes('belge') || lower.includes('doküman') || lower.includes('document') || lower.includes('yaz') || lower.includes('oluştur')) {
      intent = 'document';
      needsTool = true;
      suggestedTools = ['document'];
    }
  } else {
    intent = 'out_of_scope';
  }

  return {
    currentStep: isOutOfScope ? 'generate_response' : (needsTool ? 'use_tools' : 'generate_response'),
    tools: suggestedTools,
    context: {
      ...state.context,
      intent,
      needsTool,
      suggestedTools,
      isOutOfScope,
    },
  };
}

export async function useTools(state: AgentState) {
  const results: Record<string, any> = {};
  
  // Execute tools based on intent
  for (const tool of state.tools) {
    try {
      switch (tool) {
        case 'weather':
          // Simulate weather tool - in real implementation, call actual weather API
          results.weather = {
            temperature: '22°C',
            condition: 'Sunny',
            location: 'Current location',
            timestamp: new Date().toISOString(),
          };
          break;
        case 'document':
          // Simulate document tool
          results.document = {
            created: true,
            id: `doc_${Date.now()}`,
            title: 'Generated Document',
            content: 'Document content based on user request',
          };
          break;
      }
    } catch (error) {
      console.error(`Error using tool ${tool}:`, error);
      results[tool] = { error: 'Tool execution failed' };
    }
  }
  
  return {
    currentStep: 'generate_response',
    context: {
      ...state.context,
      toolResults: results,
    },
  };
}

export async function generateResponse(state: AgentState) {
  const model = createLangGraphModel(defaultLangGraphConfig);
  
  // Create context-aware response
  let systemPrompt = "You are a helpful AI assistant. Provide a clear, concise response to the user.";
  
  // Short-circuit: if out-of-scope, respond with a polite refusal aligned to student-support domain
  if (state.context.isOutOfScope) {
    const refusal = new AIMessage(
      "Bu, öğrenci desteğiyle ilgili görünmüyor. Lütfen dersleriniz, ödevleriniz, sınavlarınız, ders çalışma veya üniversiteyle ilgili konular hakkında soru sorun."
    );
    return {
      messages: [...state.messages, refusal],
      currentStep: 'complete',
      isComplete: true,
      context: {
        ...state.context,
        finalResponse: refusal.content,
      },
    };
  }
  
  if (state.context.toolResults) {
    systemPrompt += `\n\nTool results available: ${JSON.stringify(state.context.toolResults, null, 2)}`;
    systemPrompt += "\nUse this information to provide a helpful response.";
  }
  
  if (state.context.intent) {
    systemPrompt += `\n\nDetected intent: ${state.context.intent}`;
  }
  
  const messages = [
    new SystemMessage(systemPrompt),
    ...state.messages,
  ];
  
  try {
    const response = await model.invoke(messages);
    const aiMessage = new AIMessage(response.content);
    
    return {
      messages: [...state.messages, aiMessage],
      currentStep: 'complete',
      isComplete: true,
      context: {
        ...state.context,
        finalResponse: response.content,
      },
    };
    
  } catch (error) {
    console.error('Error generating response:', error);
    // Fallback response if model fails
    const fallbackMessage = new AIMessage(
      `I understand you said: "${state.userInput}". I'm here to help! How can I assist you today?`
    );
    
    return {
      messages: [...state.messages, fallbackMessage],
      currentStep: 'complete',
      isComplete: true,
      context: {
        ...state.context,
        finalResponse: fallbackMessage.content,
        error: 'Used fallback response',
      },
    };
  }
}

export async function handleError(state: AgentState) {
  const errorMessage = new AIMessage(
    "I apologize, but I encountered an error processing your request. Please try again."
  );
  
  return {
    messages: [...state.messages, errorMessage],
    currentStep: 'complete',
    isComplete: true,
    context: {
      ...state.context,
      error: true,
    },
  };
}