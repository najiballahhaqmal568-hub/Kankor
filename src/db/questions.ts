import { ALL_QUESTIONS } from '../data/bank';
import type { Question } from '../data/schema';

const BY_ID = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));

/** یافتن سؤال از روی شناسه (از بانک استاتیک) */
export function getQuestion(id: string): Question | undefined {
  return BY_ID.get(id);
}

/** یافتن چند سؤال به‌ترتیب شناسه‌ها */
export function getQuestions(ids: string[]): Question[] {
  return ids.map((id) => BY_ID.get(id)).filter((q): q is Question => q != null);
}
