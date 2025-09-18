import monkInfo from '@/monk_info.json';

type QuestionAnalytics = {
  status: string;
  difficulty: 'Kolay' | 'Orta' | 'Zor';
  is_correct: boolean;
  order_index: number;
  question_id: string;
  user_answer: string | null;
  correct_answer: string | null;
  time_spent_seconds: number;
};

type Analytics = {
  score: number;
  unanswered: number;
  wrong_answers: number;
  correct_answers: number;
  total_questions: number;
  question_analytics: QuestionAnalytics[];
  total_time_seconds: number;
  accuracy_percentage: number;
  completion_percentage: number;
  average_time_per_question: number;
};

function getAnalytics(): Analytics {
  return (monkInfo as any).analytics as Analytics;
}




export function todaySolvedCount() {
  const a = getAnalytics();
  // Veri setinde gün bazlı ayrım yok; mevcut toplam soru sayısını döneriz.
  return { total_questions: a.total_questions };
}

export function testResultsSummary() {
  const a = getAnalytics();
  return {
    total_questions: a.total_questions,
    correct_answers: a.correct_answers,
    wrong_answers: a.wrong_answers,
    accuracy_percentage: a.accuracy_percentage,
  };
}

export function errorPatterns() {
  const a = getAnalytics();
  const wrong = a.question_analytics.filter((q: QuestionAnalytics) => !q.is_correct);
  const buckets = { Kolay: 0, Orta: 0, Zor: 0 } as Record<string, number>;
  for (const q of wrong) buckets[q.difficulty] = (buckets[q.difficulty] || 0) + 1;
  return { wrong_count: wrong.length, by_difficulty: buckets };
}





