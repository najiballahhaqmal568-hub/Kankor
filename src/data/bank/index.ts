import type { Question } from '../schema';
import raw from './questions.json';

/**
 * نسخه بانک سؤالات. هر بار که محتوای questions.json تغییر کند این عدد بالا برود
 * تا seed دوباره در IndexedDB اجرا شود (ADR-002).
 */
export const BANK_VERSION = 4;

interface QuestionsFile {
  schema_version: string;
  questions: Question[];
}

const FILE = raw as unknown as QuestionsFile;

/** همه سؤالات موجود در فایل، بدون فیلتر — برای اعتبارسنجی و ابزارهای توسعه */
export const RAW_QUESTIONS: Question[] = FILE.questions;

/**
 * سؤالات قابل‌نمایش: در پروداکشن فقط verified===true؛ در توسعه همه (تا سؤالات
 * نیازمند بازبینی هم قابل مشاهده و تست باشند).
 */
export const ALL_QUESTIONS: Question[] = import.meta.env.PROD
  ? RAW_QUESTIONS.filter((q) => q.verified === true)
  : RAW_QUESTIONS;

/** اعتبارسنجی ساختار بانک — در حالت توسعه هشدار می‌دهد */
export function validateBank(questions: Question[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const q of questions) {
    if (seen.has(q.id)) errors.push(`شناسه تکراری: ${q.id}`);
    seen.add(q.id);
    if (q.options.length < 2) errors.push(`${q.id}: باید حداقل ۲ گزینه داشته باشد`);
    const correctCount = q.options.filter((o) => o.correct).length;
    if (correctCount !== 1) errors.push(`${q.id}: باید دقیقاً یک گزینه correct=true داشته باشد`);
    if (!q.explanation) errors.push(`${q.id}: explanation خالی است`);
    if (!q.chapter_ref) errors.push(`${q.id}: chapter_ref خالی است`);
    for (const [i, o] of q.options.entries()) {
      if (o.correct && !o.why_correct) errors.push(`${q.id}: گزینه ${i} correct ولی why_correct ندارد`);
      if (!o.correct && !o.why_wrong) errors.push(`${q.id}: گزینه ${i} غلط ولی why_wrong ندارد`);
    }
  }
  return errors;
}
