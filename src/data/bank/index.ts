import type { Question } from '../schema';
import math from './math.json';
import physics from './physics.json';
import chemistry from './chemistry.json';
import biology from './biology.json';
import dari from './dari.json';
import pashto from './pashto.json';
import english from './english.json';
import islamic from './islamic.json';
import history from './history.json';
import geography from './geography.json';

/**
 * نسخه بانک سؤالات. هر بار که محتوای سؤالات تغییر کند این عدد بالا برود
 * تا seed دوباره در IndexedDB اجرا شود (ADR-002).
 */
export const BANK_VERSION = 1;

export const ALL_QUESTIONS: Question[] = [
  ...math,
  ...physics,
  ...chemistry,
  ...biology,
  ...dari,
  ...pashto,
  ...english,
  ...islamic,
  ...history,
  ...geography,
] as Question[];

/** اعتبارسنجی ساختار بانک — در حالت توسعه هشدار می‌دهد */
export function validateBank(questions: Question[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const q of questions) {
    if (seen.has(q.id)) errors.push(`شناسه تکراری: ${q.id}`);
    seen.add(q.id);
    if (q.options.length !== 4) errors.push(`${q.id}: باید دقیقاً ۴ گزینه داشته باشد`);
    if (q.correctIndex < 0 || q.correctIndex > 3) errors.push(`${q.id}: correctIndex نامعتبر`);
    if (!q.studyHint) errors.push(`${q.id}: studyHint خالی است`);
  }
  return errors;
}
