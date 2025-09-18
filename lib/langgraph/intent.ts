import { ChatOpenAI } from '@langchain/openai';
import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

type Label = 'student_support' | 'out_of_scope';

function getJudgeModel() {
  // Use the cheapest available chat model (project already uses gpt-4o-mini)
  // If you have a "gpt5-nano" alias via your gateway, replace modelName below.
  return new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4o-mini',
    maxTokens: 256,
  });
}

const judgeSystem = new SystemMessage(
  'Sen bir niyet politikası (intent policy) hakemisin. Yanıtını yalnızca katı JSON formatında ver. Görevin, kullanıcının isteğinin öğrenci desteği kapsamında olup olmadığını belirlemektir. ' +
  'öğrenci desteği kapsamına giren konular dersler, ödevler ve projeler, sınavlar ve quizler, çalışma stratejileri ve yöntemleri, akademik yazım, üniversiteye ilişkin süreçler (kayıt, danışmanlık, ders seçimi vb.), hocalar/profesörler ve notlandırmadır; bunların dışındaki tüm konular (örneğin eğlence, finans, seyahat, alışveriş, haberler, kişisel işler, diyetler, tamirat vb.) kapsam dışı kabul edilir' +
  'JSON çıktısında iki anahtar bulunmalıdır: label (student_support veya out_of_scope) ve rationale (kararın nedenini açıklayan kısa İngilizce ifade)'
  
);

function buildJudgeUserPrompt(input: string): string {
  return [
    'Classify the following request strictly by the policy.',
    'Return JSON ONLY, no extra text.',
    'Request:',
    '"""',
    input,
    '"""',
    'JSON schema:',
    '{"label":"student_support|out_of_scope","rationale":"string"}',
  ].join('\n');
}

export async function judgeIntent(input: string): Promise<{ label: Label; rationale: string }> {
  const model = getJudgeModel();
  const messages: BaseMessage[] = [
    judgeSystem,
    new HumanMessage(buildJudgeUserPrompt(input)),
  ];
  const res = await model.invoke(messages);
  const raw = typeof res.content === 'string' ? res.content : JSON.stringify(res.content);
  // Best-effort JSON extraction
  const match = raw.match(/\{[\s\S]*\}/);
  const jsonText = match ? match[0] : raw;

  try {
    const parsed = JSON.parse(jsonText);
    const label = (parsed.label === 'out_of_scope') ? 'out_of_scope' : 'student_support';
    const rationale = typeof parsed.rationale === 'string' ? parsed.rationale : '';
    return { label, rationale };
  } catch {
    // Fallback: be safe and default to out_of_scope if parsing fails
    return { label: 'out_of_scope', rationale: 'Failed to parse judge output.' };
  }
}


