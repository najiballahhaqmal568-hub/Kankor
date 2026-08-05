import type { Question } from '../schema';
import raw from './questions.json';

/**
 * نسخه بانک سؤالات. هر بار که محتوای questions.json تغییر کند این عدد بالا برود
 * تا seed دوباره در IndexedDB اجرا شود (ADR-002).
 */
export const BANK_VERSION = 8;

interface QuestionsFile {
  schema_version: string;
  questions: Question[];
}

const BANK_FILE = raw as unknown as QuestionsFile;

/** همه سؤالات موجود در فایل، بدون فیلتر */
const RAW_QUESTIONS: Question[] = BANK_FILE.questions;

/**
 * سؤالات قابل‌نمایش: در پروداکشن فقط verified===true؛ در توسعه همه (تا سؤالات
 * نیازمند بازبینی هم قابل مشاهده و تست باشند).
 */
export const ALL_QUESTIONS: Question[] = import.meta.env.PROD
  ? RAW_QUESTIONS.filter((q) => q.verified === true)
  : RAW_QUESTIONS;

/**
 * تعداد گزینه‌های هر سؤال کانکور. همان قاعده‌ای که دروازه ادغام
 * (`scripts/merge-batch.mjs` → REQUIRED_OPTION_COUNT) اعمال می‌کند —
 * این دو باید همیشه یکی بمانند وگرنه بانک و دروازه از هم واگرا می‌شوند.
 */
const REQUIRED_OPTION_COUNT = 4;

/** اعتبارسنجی ساختار بانک — در حالت توسعه هشدار می‌دهد */
export function validateBank(questions: Question[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const q of questions) {
    if (seen.has(q.id)) errors.push(`شناسه تکراری: ${q.id}`);
    seen.add(q.id);
    if (q.options.length !== REQUIRED_OPTION_COUNT) {
      errors.push(`${q.id}: باید دقیقاً ${REQUIRED_OPTION_COUNT} گزینه داشته باشد (دارد: ${q.options.length})`);
    }
    const correctCount = q.options.filter((o) => o.correct).length;
    if (correctCount !== 1) errors.push(`${q.id}: باید دقیقاً یک گزینه correct=true داشته باشد`);
    if (!q.topic) errors.push(`${q.id}: topic خالی است`);
    if (!q.explanation) errors.push(`${q.id}: explanation خالی است`);
    if (!q.chapter_ref) errors.push(`${q.id}: chapter_ref خالی است`);
    for (const [i, o] of q.options.entries()) {
      if (o.correct && !o.why_correct) errors.push(`${q.id}: گزینه ${i} correct ولی why_correct ندارد`);
      if (!o.correct && !o.why_wrong) errors.push(`${q.id}: گزینه ${i} غلط ولی why_wrong ندارد`);
    }
  }
  return errors;
}
