import { useState } from 'react';
import { applyFontSize, getFontSize, type FontSize } from '../lib/settings';
import { applyTheme, getTheme, type Theme } from '../lib/theme';
import { db } from '../db/db';
import { BANK_VERSION } from '../data/bank';
import { faNum } from '../lib/format';

const FONT_OPTIONS: { value: FontSize; label: string }[] = [
  { value: 'small', label: 'کوچک' },
  { value: 'normal', label: 'عادی' },
  { value: 'large', label: 'بزرگ' },
];

export default function Settings() {
  const [theme, setTheme] = useState<Theme>(getTheme);
  const [font, setFont] = useState<FontSize>(getFontSize);

  const changeTheme = (t: Theme) => {
    applyTheme(t);
    setTheme(t);
  };
  const changeFont = (f: FontSize) => {
    applyFontSize(f);
    setFont(f);
  };

  const clearProgress = async () => {
    if (!confirm('تمام پیشرفت شما (کارنامه‌ها و صف مرور) پاک شود؟ این کار برگشت‌ناپذیر است.')) return;
    await db.transaction('rw', db.attempts, db.answers, db.srsCards, db.activeExam, async () => {
      await db.attempts.clear();
      await db.answers.clear();
      await db.srsCards.clear();
      await db.activeExam.clear();
    });
    alert('پیشرفت پاک شد.');
  };

  return (
    <div className="stack">
      <h1 className="page-title">تنظیمات</h1>

      <div className="card">
        <h3>ظاهر</h3>
        <div className="row spread">
          <span>تم</span>
          <div className="filter-group">
            <button
              className={`chip chip-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => changeTheme('dark')}
            >
              🌙 تاریک
            </button>
            <button
              className={`chip chip-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => changeTheme('light')}
            >
              ☀️ روشن
            </button>
          </div>
        </div>
        <div className="row spread" style={{ marginTop: 'var(--space-3)' }}>
          <span>اندازه فونت</span>
          <div className="filter-group">
            {FONT_OPTIONS.map((f) => (
              <button
                key={f.value}
                className={`chip chip-btn ${font === f.value ? 'active' : ''}`}
                onClick={() => changeFont(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>داده‌ها</h3>
        <p className="small muted">
          همه داده‌ها روی همین دستگاه و به‌صورت آفلاین ذخیره می‌شوند. بانک سؤالات همراه اپ است و
          نیازی به اینترنت ندارد.
        </p>
        <button className="btn" onClick={clearProgress} style={{ borderColor: 'var(--wrong)' }}>
          🗑 پاک‌کردن پیشرفت من
        </button>
      </div>

      <div className="card">
        <h3>درباره</h3>
        <p className="small muted">
          اپ آمادگی کانکور افغانستان — فاز ۱ (MVP آفلاین).
          <br />
          نسخه بانک سؤالات: {faNum(BANK_VERSION)}
        </p>
      </div>
    </div>
  );
}
