import { db } from './db';
import type { SrsCard, SubjectId } from '../data/schema';

/** ضریب آسانی اولیه در الگوریتم SM-2 */
export const INITIAL_EASINESS = 2.5;

/**
 * افزودن یک سؤالِ غلط‌جواب‌شده به صف مرور فاصله‌دار (اگر از قبل نباشد).
 * کارت با سررسید «همین حالا» ساخته می‌شود تا در اولین مرور بیاید.
 * منطق زمان‌بندی SM-2 در مرحله ۶ (logic/sm2.ts) اعمال می‌شود.
 */
export async function enqueueForReview(questionId: string, subject: SubjectId): Promise<void> {
  const existing = await db.srsCards.get(questionId);
  if (existing) return;
  const now = Date.now();
  const card: SrsCard = {
    questionId,
    subject,
    easiness: INITIAL_EASINESS,
    intervalDays: 0,
    repetitions: 0,
    dueDate: now,
    lastQuality: 0,
    addedAt: now,
  };
  await db.srsCards.put(card);
}

/** تعداد کارت‌های سررسیدشده تا این لحظه */
export async function dueCount(now = Date.now()): Promise<number> {
  return db.srsCards.where('dueDate').belowOrEqual(now).count();
}
