import { AgentState } from './schema';
import { processUserInput, analyzeIntent, useTools, generateResponse, handleError } from './nodes';

// Modern LangGraph-style workflow with enhanced flexibility
export class AgentWorkflow {
  private nodes: Map<string, (state: AgentState) => Promise<Partial<AgentState>>>;
  private edges: Map<string, string[]>;
  private conditionalEdges: Map<string, (state: AgentState) => string>;

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.conditionalEdges = new Map();
    this.setupWorkflow();
  }

  private setupWorkflow() {
    // Register nodes
    this.nodes.set('process_input', processUserInput);
    this.nodes.set('analyze_intent', analyzeIntent);
    this.nodes.set('use_tools', useTools);
    this.nodes.set('generate_response', generateResponse);
    this.nodes.set('handle_error', handleError);

    // Register edges
    this.edges.set('process_input', ['analyze_intent']);
    this.edges.set('use_tools', ['generate_response']);
    this.edges.set('generate_response', ['__end__']);

    // Register conditional edges
    this.conditionalEdges.set('analyze_intent', (state) => {
      if (state.context.isOutOfScope) {
        return 'generate_response';
      } else if (state.tools.length > 0) {
        return 'use_tools';
      } else {
        return 'generate_response';
      }
    });
  }

  async invoke(initialState: AgentState): Promise<AgentState> {
    try {
      let currentState = { ...initialState };
      let currentNode = 'process_input';

      while (currentNode !== '__end__') {
        // Execute current node
        const nodeFunction = this.nodes.get(currentNode);
        if (!nodeFunction) {
          throw new Error(`Node ${currentNode} not found`);
        }

        const nodeResult = await nodeFunction(currentState);
        currentState = { ...currentState, ...nodeResult };

        // Determine next node
        if (this.conditionalEdges.has(currentNode)) {
          const conditionalFunction = this.conditionalEdges.get(currentNode)!;
          currentNode = conditionalFunction(currentState);
        } else if (this.edges.has(currentNode)) {
          const nextNodes = this.edges.get(currentNode)!;
          currentNode = nextNodes[0]; // Take first edge for now
        } else {
          currentNode = '__end__';
        }
      }

      return currentState;
    } catch (error) {
      console.error('Workflow error:', error);
      const errorResult = await handleError(initialState);
      return { ...initialState, ...errorResult };
    }
  }

  // Add new node dynamically
  addNode(name: string, nodeFunction: (state: AgentState) => Promise<Partial<AgentState>>) {
    this.nodes.set(name, nodeFunction);
  }

  // Add new edge dynamically
  addEdge(from: string, to: string) {
    if (!this.edges.has(from)) {
      this.edges.set(from, []);
    }
    this.edges.get(from)!.push(to);
  }

  // Add conditional edge dynamically
  addConditionalEdge(from: string, conditionFunction: (state: AgentState) => string) {
    this.conditionalEdges.set(from, conditionFunction);
  }

  // Get workflow visualization
  getWorkflowInfo() {
    return {
      nodes: Array.from(this.nodes.keys()),
      edges: Object.fromEntries(this.edges),
      conditionalEdges: Array.from(this.conditionalEdges.keys()),
    };
  }
}

// Create workflow instance
export const agentWorkflow = new AgentWorkflow();

// Legacy compatibility function
export async function runAgentWorkflow(initialState: AgentState): Promise<AgentState> {
  return agentWorkflow.invoke(initialState);
}