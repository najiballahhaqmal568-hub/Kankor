import { describe, expect, it } from 'vitest';
import { MIN_EASINESS, reviewCard } from './sm2';

const DAY = 24 * 60 * 60 * 1000;
const base = { easiness: 2.5, intervalDays: 0, repetitions: 0 };

describe('reviewCard — پاسخ موفق (q>=3)', () => {
  it('اولین مرور موفق فاصله را ۱ روز می‌کند', () => {
    const r = reviewCard(base, 4, 0);
    expect(r.repetitions).toBe(1);
    expect(r.intervalDays).toBe(1);
    expect(r.dueDate).toBe(DAY);
  });

  it('دومین مرور موفق فاصله را ۶ روز می‌کند', () => {
    const r = reviewCard({ easiness: 2.5, intervalDays: 1, repetitions: 1 }, 4, 0);
    expect(r.repetitions).toBe(2);
    expect(r.intervalDays).toBe(6);
  });

  it('مرورهای بعدی فاصله را در ضریب آسانی ضرب می‌کند', () => {
    const r = reviewCard({ easiness: 2.5, intervalDays: 6, repetitions: 2 }, 5, 0);
    expect(r.repetitions).toBe(3);
    // 6 * EF(جدید) ≈ 6 * 2.6 = 15.6 → 16
    expect(r.intervalDays).toBe(16);
  });
});

describe('reviewCard — پاسخ ناموفق (q<3)', () => {
  it('تکرار را صفر و فاصله را به ۱ روز برمی‌گرداند', () => {
    const r = reviewCard({ easiness: 2.5, intervalDays: 16, repetitions: 3 }, 1, 0);
    expect(r.repetitions).toBe(0);
    expect(r.intervalDays).toBe(1);
  });
});

describe('reviewCard — ضریب آسانی', () => {
  it('با کیفیت بالا افزایش می‌یابد', () => {
    expect(reviewCard(base, 5, 0).easiness).toBeGreaterThan(2.5);
  });

  it('با کیفیت پایین کاهش می‌یابد', () => {
    expect(reviewCard(base, 3, 0).easiness).toBeLessThan(2.5);
  });

  it('هرگز زیر کف ۱٫۳ نمی‌رود', () => {
    let card = { ...base };
    for (let i = 0; i < 10; i++) {
      const r = reviewCard(card, 0, 0);
      card = { easiness: r.easiness, intervalDays: r.intervalDays, repetitions: r.repetitions };
    }
    expect(card.easiness).toBeGreaterThanOrEqual(MIN_EASINESS);
  });
});
