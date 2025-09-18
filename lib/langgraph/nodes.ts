import { AgentState } from './schema';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { createLangGraphModel, defaultLangGraphConfig } from './config';
import { judgeIntent } from './intent';
import {  todaySolvedCount, testResultsSummary, errorPatterns } from './student';
import { classifyTopic } from './classifier';

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

  // Detect personalized student insights prompts (whitelist) BEFORE judge
  const isStudentInsights = [
    'bugün ne kadar soru çözdüm',
    'test sonuçlarım neler',
    'hangi tarz sorularda hata yapıyorum',
  ].some((k) => lower.includes(k));

  if (isStudentInsights) {
    intent = 'student_insights';
    needsTool = true;
    suggestedTools = ['student_insights'];
  } else {
    const { label } = await judgeIntent(original);
    isOutOfScope = label === 'out_of_scope';

    if (!isOutOfScope) {
      // Topic classifier path (embedding-based), only when in-scope and not matched above
      const topicResult = await classifyTopic(original);
      (state as any).context = { ...state.context, classifierTopic: topicResult.topic, classifierScores: topicResult.scores };
      // For now, always route to classifier tool and just print agent working message
      intent = 'classifier_topic';
      needsTool = true;
      suggestedTools = ['classifier_topic'];
    } else {
      intent = 'out_of_scope';
    }
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
        case 'classifier_topic': {
          const topic = (state.context as any).classifierTopic as string;
          let msg = '';
          if (topic === 'danisman') msg = 'danışman ajanı çalışıyor.';
          else if (topic === 'kisisel_analiz') msg = 'kişisel analiz ajanı çalışıyor.';
          else if (topic === 'test_olusturma') msg = 'test oluşturma ajanı çalışıyor.';
          results.classifier_topic = { topic, message: msg };
          break;
        }
        case 'student_insights': {
          const text = state.context.lastUserMessage?.toLowerCase() || '';
          if (text.includes('bugün ne kadar soru çözdüm')) {
            results.student_insights = { type: 'today_count', data: todaySolvedCount() };
          } else if (text.includes('test sonuçlarım neler')) {
            results.student_insights = { type: 'results', data: testResultsSummary() };
          } else if (text.includes('hangi tarz sorularda hata yapıyorum')) {
            results.student_insights = { type: 'error_patterns', data: errorPatterns() };
          } else {
            results.student_insights = { type: 'unknown', data: {} };
          }
          break;
        }
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
    // If classifier topic produced a message, short-circuit and return it (no LLM call)
    if (state.context.toolResults.classifier_topic) {
      const { message } = state.context.toolResults.classifier_topic;
      const ai = new AIMessage(message);
      return {
        messages: [...state.messages, ai],
        currentStep: 'complete',
        isComplete: true,
        context: {
          ...state.context,
          finalResponse: message,
        },
      };
    }
    // For student_insights, craft Turkish prompts to format natural-language answers
    if (state.context.toolResults.student_insights) {
      const si = state.context.toolResults.student_insights;
      if (si.type === 'today_count') {
        systemPrompt += `\n\nKullanıcı sorusu: 'Bugün ne kadar soru çözdüm?'\nVeri: total_questions=${si.data.total_questions}.\nCevap yönergesi: Kullanıcının bugün çözdüğü soru sayısı ${si.data.total_questions}. Bunu 1-2 cümlede Türkçe ve doğal bir üslupla ifade et.`;
      } else if (si.type === 'results') {
        systemPrompt += `\n\nKullanıcı sorusu: 'Test sonuçlarım neler?'\nVeri: toplam=${si.data.total_questions}, doğru=${si.data.correct_answers}, yanlış=${si.data.wrong_answers}, doğruluk=${si.data.accuracy_percentage}%.\nCevap yönergesi: Bu sonuçları kısa ve anlaşılır Türkçe bir paragrafla özetle; motive edici bir cümle ekle.`;
      } else if (si.type === 'error_patterns') {
        systemPrompt += `\n\nKullanıcı sorusu: 'Hangi tarz sorularda hata yapıyorum?'\nVeri: toplam yanlış=${si.data.wrong_count}, dağılım=${JSON.stringify(si.data.by_difficulty)}.\nCevap yönergesi: Yanlış sayısı ve zorluk dağılımını açıkla; 2-3 somut gelişim önerisi ver.`;
      }
    } else {
      systemPrompt += `\n\nTool results available: ${JSON.stringify(state.context.toolResults, null, 2)}`;
      systemPrompt += "\nUse this information to provide a helpful response.";
    }
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