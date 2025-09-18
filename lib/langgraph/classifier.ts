import { OpenAIEmbeddings } from '@langchain/openai';

export type Topic = 'kisisel_analiz' | 'test_olusturma' | 'danisman';

const kisiselAnalizExemplars: string[] = [
  'Performansımı analiz eder misin?',
  'Hangi konularda güçlü ve zayıfım?',
  'Çalışma alışkanlıklarımı değerlendir.',
  'Yanlış yaptığım soru tiplerini özetle.',
  'Zaman yönetimimde nerede sorun var?',
  'Genel başarı oranımı yorumla.',
  'Haftalık ilerlememi analiz et.',
  'Eksik kaldığım konuları çıkar.',
  'Sınav stratejimi değerlendirir misin?',
  'Son test sonuçlarıma göre kişisel analiz yap.',
];

const testOlusturmaExemplars: string[] = [
  'Bana deneme testi hazırlar mısın?',
  'Konuya özel quiz oluştur.',
  '10 soruluk pratik test istiyorum.',
  'Zor seviye matematik testi hazırla.',
  'Karışık konulardan deneme oluştur.',
  'Boşluk doldurma soruları üret.',
  'Kısa cevaplı bir test hazırla.',
  'Çoktan seçmeli test oluştur.',
  'Süreli bir mini sınav ayarla.',
  'Tekrara yönelik günlük test üret.',
];

const danismanExemplars: string[] = [
  'Nasıl bir çalışma planı önerirsin?',
  'Sınav stresiyle nasıl başa çıkarım?',
  'Motivasyonumu artırmak için öneri ver.',
  'Hangi kaynakları kullanmalıyım?',
  'Günlük programımı nasıl düzenlemeliyim?',
  'Uzun vadeli hedef planı çıkar.',
  'Ders ve sosyal hayat dengesi nasıl kurulur?',
  'Verimli not alma teknikleri öner.',
  'Tekrar stratejisi önerir misin?',
  'Odaklanma sorunları için tavsiye ver.',
];

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
});

function dot(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
function norm(a: number[]) {
  return Math.sqrt(dot(a, a));
}
function cosine(a: number[], b: number[]) {
  const d = dot(a, b);
  const n = norm(a) * norm(b);
  return n === 0 ? 0 : d / n;
}

let cache: {
  kisisel: number[][] | null;
  test: number[][] | null;
  danisman: number[][] | null;
} = { kisisel: null, test: null, danisman: null };

async function ensureCache() {
  if (!cache.kisisel) cache.kisisel = await embeddings.embedDocuments(kisiselAnalizExemplars);
  if (!cache.test) cache.test = await embeddings.embedDocuments(testOlusturmaExemplars);
  if (!cache.danisman) cache.danisman = await embeddings.embedDocuments(danismanExemplars);
}

export async function classifyTopic(input: string): Promise<{ topic: Topic; scores: Record<Topic, number> }> {
  await ensureCache();
  const q = await embeddings.embedQuery(input);

  const maxSim = (arr: number[][]) => Math.max(...arr.map((v) => cosine(q, v)));
  const scoreK = maxSim(cache.kisisel as number[][]);
  const scoreT = maxSim(cache.test as number[][]);
  const scoreD = maxSim(cache.danisman as number[][]);

  const scores: Record<Topic, number> = {
    kisisel_analiz: scoreK,
    test_olusturma: scoreT,
    danisman: scoreD,
  };

  let topic: Topic = 'kisisel_analiz';
  let best = scoreK;
  if (scoreT > best) {
    topic = 'test_olusturma';
    best = scoreT;
  }
  if (scoreD > best) {
    topic = 'danisman';
  }

  return { topic, scores };
}


