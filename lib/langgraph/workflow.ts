import { AgentState } from './state';
import { generateResponse } from './nodes';
import { HumanMessage } from '@langchain/core/messages';

// Simplified workflow - just generate response directly
export async function runAgentWorkflow(initialState: AgentState): Promise<AgentState> {
  try {
    // Process user input
    const userMessage = new HumanMessage(initialState.userInput);
    const messages = [...initialState.messages, userMessage];
    
    // Analyze intent (simplified)
    let intent = 'general';
    let tools: string[] = [];
    const message = initialState.userInput.toLowerCase();
    
    if (message.includes('weather')) {
      intent = 'weather';
      tools = ['weather'];
    } else if (message.includes('document') || message.includes('create') || message.includes('write')) {
      intent = 'document';
      tools = ['document'];
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