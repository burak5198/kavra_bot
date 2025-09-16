# LangGraph Integration

This directory contains the LangGraph integration for the AI chatbot, providing agent-based conversation flows with GPT-4o-mini.

## Files

- `config.ts` - LangGraph configuration with GPT-4o-mini setup
- `state.ts` - Agent state definition
- `nodes.ts` - Agent processing nodes
- `workflow.ts` - Main workflow definition
- `README.md` - This file

## Features

- **GPT-4o-mini Integration**: Cost-effective AI model for agent responses
- **Intent Analysis**: Automatic detection of user intent (weather, documents, general)
- **Tool Integration**: Built-in tools for weather and document operations
- **Error Handling**: Robust error handling throughout the workflow
- **State Management**: Persistent conversation state across interactions

## Usage

1. Add your OpenAI API key to the `.env` file:
   ```
   OPENAI_API_KEY=your-api-key-here
   ```

2. Select "LangGraph Agent" from the model selector in the chat interface

3. The agent will automatically:
   - Process your input
   - Analyze intent
   - Use appropriate tools if needed
   - Generate contextual responses

## LangGraph Studio

To visualize and debug the workflow:

```bash
pnpm langgraph:studio
```

This will open LangGraph Studio at `http://localhost:8123` where you can:
- Visualize the workflow graph
- Debug individual nodes
- Test the workflow with sample inputs
- Monitor execution flow

## Workflow Steps

1. **process_input**: Processes user input and initializes context
2. **analyze_intent**: Determines user intent and required tools
3. **use_tools**: Executes appropriate tools based on intent
4. **generate_response**: Generates final response using context and tool results
5. **handle_error**: Handles any errors that occur during processing

## Customization

You can extend the workflow by:
- Adding new tools in `nodes.ts`
- Modifying intent detection logic
- Adding new workflow steps
- Customizing the system prompts
