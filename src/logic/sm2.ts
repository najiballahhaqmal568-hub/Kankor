import type { SrsCard } from '../data/schema';

export const MIN_EASINESS = 1.3;
const DAY_MS = 24 * 60 * 60 * 1000;

/** بخش‌های به‌روزرسانی‌شونده یک کارت پس از مرور */
export type SrsProgress = Pick<
  SrsCard,
  'easiness' | 'intervalDays' | 'repetitions' | 'dueDate' | 'lastQuality'
>;

/**
 * الگوریتم SuperMemo-2.
 * quality: کیفیت یادآوری در بازه ۰..۵ (۳ و بالاتر = موفق).
 * now: زمان مرجع (پیش‌فرض اکنون) — برای تست‌پذیری تزریق می‌شود.
 *
 * قواعد:
 *  - q < 3  → تکرار صفر می‌شود و فاصله به ۱ روز برمی‌گردد (شروع دوباره).
 *  - q >= 3 → تکرار اول ۱ روز، دوم ۶ روز، بعدی‌ها interval×EF.
 *  - EF با فرمول استاندارد به‌روز و کف آن ۱٫۳ است.
 */
export function reviewCard(
  card: Pick<SrsCard, 'easiness' | 'intervalDays' | 'repetitions'>,
  quality: number,
  now: number = Date.now(),
): SrsProgress {
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  let easiness = card.easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easiness < MIN_EASINESS) easiness = MIN_EASINESS;

  let repetitions: number;
  let intervalDays: number;

  if (q < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions = card.repetitions + 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(card.intervalDays * easiness);
  }

  return {
    easiness: Number(easiness.toFixed(2)),
    intervalDays,
    repetitions,
    dueDate: now + intervalDays * DAY_MS,
    lastQuality: q,
  };
}
