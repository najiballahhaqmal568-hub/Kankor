/** تبدیل ارقام لاتین به ارقام دری/فارسی */
const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function faNum(value: number | string): string {
  return String(value).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/** درصد با ارقام دری، مثلاً «۷۵٪» */
export function faPercent(ratio: number): string {
  return `${faNum(Math.round(ratio * 100))}٪`;
}

/** ثانیه → «م:ث» یا «س:م:ث» با ارقام دری */
export function faDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const two = (n: number) => String(n).padStart(2, '0');
  const raw = h > 0 ? `${h}:${two(m)}:${two(sec)}` : `${m}:${two(sec)}`;
  return faNum(raw);
}

/** تاریخ خوانا به تقویم هجری شمسی (پشتیبانی بومی مرورگر) */
export function faDate(ts: number): string {
  return new Intl.DateTimeFormat('fa-AF-u-ca-persian', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts));
}
