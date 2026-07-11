import { db } from './db';
import { ALL_QUESTIONS, BANK_VERSION, validateBank } from '../data/bank';

const BANK_VERSION_KEY = 'bankVersion';

/**
 * محتوای سؤالات را در اولین اجرا (یا وقتی نسخه بانک بالا رفته) به IndexedDB وارد می‌کند.
 * وضعیت کاربر (attempts, answers, srsCards) هرگز پاک نمی‌شود.
 */
export async function seedIfNeeded(): Promise<void> {
  if (import.meta.env.DEV) {
    const errors = validateBank(ALL_QUESTIONS);
    if (errors.length) console.warn('اعتبارسنجی بانک سؤالات:', errors);
  }

  const meta = await db.meta.get(BANK_VERSION_KEY);
  const currentVersion = typeof meta?.value === 'number' ? meta.value : 0;

  if (currentVersion >= BANK_VERSION) return;

  await db.transaction('rw', db.questions, db.meta, async () => {
    await db.questions.clear();
    await db.questions.bulkPut(ALL_QUESTIONS);
    await db.meta.put({ key: BANK_VERSION_KEY, value: BANK_VERSION });
  });
}
