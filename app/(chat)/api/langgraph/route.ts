import { NextRequest, NextResponse } from 'next/server';
import { agentWorkflow } from '@/lib/langgraph/workflow';
import { AgentState } from '@/lib/langgraph/state';
import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { 
  saveMessages, 
  getMessagesByChatId, 
  getChatById,
  saveChat 
} from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';
import { createUIMessageStream, JsonToSseTransformStream } from 'ai';
import { myProvider } from '@/lib/ai/providers';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const { message, chatId, selectedVisibilityType = 'private' } = await request.json();

    if (!message || !chatId) {
      return new ChatSDKError('bad_request:api').toResponse();
    }

    // Extract text from ChatMessage parts (fallback to message.content if provided)
    const messageText =
      typeof message?.content === 'string'
        ? message.content
        : Array.isArray(message?.parts)
          ? message.parts
              .filter((p: any) => p?.type === 'text' && typeof p?.text === 'string')
              .map((p: any) => p.text)
              .join('')
          : '';

    if (!messageText) {
      return new ChatSDKError('bad_request:api', 'Empty message').toResponse();
    }

    let chat = await getChatById({ id: chatId });
    if (!chat) {
      await saveChat({
        id: chatId,
        userId: session.user.id,
        title: messageText || 'New Chat',
        visibility: selectedVisibilityType,
      });
    }

    const existingMessages = await getMessagesByChatId({ id: chatId });

    await saveMessages({
      messages: [
        {
          chatId,
          id: generateUUID(),
          role: 'user',
          parts: [{ type: 'text', text: messageText }],
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    const initialState: AgentState = {
      messages: existingMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: Array.isArray(msg.parts)
          ? msg.parts.map((part: any) => part.text || part.content).join(' ')
          : String(msg.parts),
      })) as any[],
      currentStep: 'start',
      userInput: messageText,
      context: {},
      tools: [],
      isComplete: false,
      chatId,
      userId: session.user.id,
    };

    // Run the LangGraph workflow
    const result = await (agentWorkflow as any).invoke(initialState as any);

    // Find AI messages - they can be AIMessage objects or plain objects with role: 'assistant'
    const aiMessages = (result as any).messages.filter((msg: any) => {
      // Check if it's a LangChain AIMessage object
      if (msg.constructor && msg.constructor.name === 'AIMessage') {
        return true;
      }
      // Check if it's a plain object with role: 'assistant'
      if (msg.role === 'assistant') {
        return true;
      }
      return false;
    });
    
    const lastAIMessage = aiMessages[aiMessages.length - 1];

    if (!lastAIMessage) {
      throw new Error('No AI response generated');
    }

    // Extract content from the AI message
    let aiContent = '';
    if (lastAIMessage.constructor && lastAIMessage.constructor.name === 'AIMessage') {
      aiContent = lastAIMessage.content;
    } else {
      aiContent = lastAIMessage.content;
    }

    // Save the AI response to database
    const assistantMessageId = generateUUID();
    await saveMessages({
      messages: [
        {
          chatId,
          id: assistantMessageId,
          role: 'assistant',
          parts: [{ type: 'text', text: String(aiContent) }],
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    // Return a simple JSON response that the main chat route can handle
    return NextResponse.json({
      success: true,
      message: {
        id: assistantMessageId,
        role: 'assistant',
        content: String(aiContent),
        parts: [{ type: 'text', text: String(aiContent) }],
      },
      context: (result as any).context,
      workflow: {
        steps: (result as any).currentStep,
        tools: (result as any).tools,
        isComplete: (result as any).isComplete,
      },
    });
  } catch (error) {
    console.error('LangGraph API error:', error);

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    return new ChatSDKError('offline:chat').toResponse();
  }
}