import { AgentState } from './state';
import { generateResponse } from './nodes';
import { judgeIntent } from './intent';
import { HumanMessage } from '@langchain/core/messages';

// Simplified workflow - just generate response directly
export async function runAgentWorkflow(initialState: AgentState): Promise<AgentState> {
  try {
    // Process user input
    const userMessage = new HumanMessage(initialState.userInput);
    const messages = [...initialState.messages, userMessage];
    
    // Analyze intent with Turkish semantic domain guard
    let intent = 'general';
    let tools: string[] = [];
    let isOutOfScope = false;
    const lower = initialState.userInput.toLowerCase();
    
    const { label } = await judgeIntent(initialState.userInput);
    isOutOfScope = label === 'out_of_scope';
    
    if (!isOutOfScope) {
      if (lower.includes('hava') || lower.includes('hava durumu') || lower.includes('weather')) {
        intent = 'weather';
        tools = ['weather'];
      } else if (lower.includes('belge') || lower.includes('doküman') || lower.includes('document') || lower.includes('yaz') || lower.includes('oluştur')) {
        intent = 'document';
        tools = ['document'];
      }
    } else {
      intent = 'out_of_scope';
    }
    
    // Use tools (simplified)
    const toolResults: Record<string, any> = {};
    for (const tool of tools) {
      if (tool === 'weather') {
        toolResults.weather = {
          temperature: '22°C',
          condition: 'Sunny',
          location: 'Current location',
          timestamp: new Date().toISOString(),
        };
      } else if (tool === 'document') {
        toolResults.document = {
          created: true,
          id: `doc_${Date.now()}`,
          title: 'Generated Document',
          content: 'Document content based on user request',
        };
      }
    }
    
    // Generate response with updated state
    const updatedState: AgentState = {
      ...initialState,
      messages,
      tools,
      context: {
        ...initialState.context,
        intent,
        tools,
        toolResults,
        isOutOfScope,
      },
    };
    
    const result = await generateResponse(updatedState);
    
    return {
      ...initialState,
      ...result,
    };
    
  } catch (error) {
    console.error('Workflow error:', error);
    
    // Return error state
    return {
      ...initialState,
      currentStep: 'error',
      isComplete: true,
      context: {
        ...initialState.context,
        error: 'Workflow execution failed',
      },
    };
  }
}

// For compatibility with existing code
export const agentWorkflow = {
  invoke: runAgentWorkflow,
};