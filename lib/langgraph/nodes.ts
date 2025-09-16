import { AgentState } from './state';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { createLangGraphModel, defaultLangGraphConfig } from './config';

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
  // Simple keyword-based intent detection
  let intent = 'general';
  let needsTool = false;
  let suggestedTools: string[] = [];
  
  const message = state.userInput.toLowerCase();
  if (message.includes('weather')) {
    intent = 'weather';
    needsTool = true;
    suggestedTools = ['weather'];
  } else if (message.includes('document') || message.includes('create') || message.includes('write')) {
    intent = 'document';
    needsTool = true;
    suggestedTools = ['document'];
  }
  
  return {
    currentStep: needsTool ? 'use_tools' : 'generate_response',
    tools: suggestedTools,
    context: {
      ...state.context,
      intent,
      needsTool,
      suggestedTools,
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