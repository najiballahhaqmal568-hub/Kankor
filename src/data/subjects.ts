import type { ExamBlueprint, Subject, SubjectId } from './schema';
import { ALL_QUESTIONS } from './bank';

/**
 * نگاشت اسم مضمون → آیکون. صرفاً تزئینی است (نه محتوای سؤال)، پس نقض
 * «هیچ فیلد را هاردکد نکن» نیست. مضمون‌های ناشناس آیکون پیش‌فرض می‌گیرند
 * تا بچ‌های بعدی با مضامین جدید بدون تغییر کد کار کنند.
 */
const ICONS: Record<string, string> = {
  ریاضیات: '📐',
  ریاضی: '📐',
  فزیک: '⚛️',
  کیمیا: '🧪',
  بیولوژی: '🧬',
  دری: '📖',
  پشتو: '📜',
  انگلیسی: '🔤',
  'علوم دینی': '🕌',
  تاریخ: '🏛️',
  جغرافیه: '🗺️',
};
const DEFAULT_ICON = '📘';

/**
 * فهرست مضامین به‌صورت پویا از بانک سؤالات استخراج می‌شود (نه یک enum ثابت)،
 * تا با افزودن بچ‌های بعدی سؤالات، مضامین جدید بدون تغییر کد ظاهر شوند.
 * fullExamCount برابر تعداد سؤال موجود در بانک فعلی است.
 */
export function computeSubjects(questions = ALL_QUESTIONS): Subject[] {
  const counts = new Map<string, number>();
  for (const q of questions) {
    counts.set(q.subject, (counts.get(q.subject) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([id, fullExamCount]) => ({
      id,
      name: id,
      icon: ICONS[id] ?? DEFAULT_ICON,
      fullExamCount,
    }))
    .sort((a, b) => a.id.localeCompare(b.id, 'fa'));
}

export const SUBJECTS: Subject[] = computeSubjects();

export const SUBJECT_MAP: Record<SubjectId, Subject> = Object.fromEntries(
  SUBJECTS.map((s) => [s.id, s]),
);

/** اگر مضمونی در نقشه نبود (داده جدید)، یک ورودی پیش‌فرض بساز تا UI خطا ندهد */
export function getSubject(id: SubjectId): Subject {
  return SUBJECT_MAP[id] ?? { id, name: id, icon: DEFAULT_ICON, fullExamCount: 0 };
}

export const FULL_EXAM_DURATION_SEC = 180 * 60;

export const FULL_EXAM_TOTAL = SUBJECTS.reduce((sum, s) => sum + s.fullExamCount, 0);

/** آزمون کامل: همه سؤالات موجود بانک (ترکیب واقعی مضامین بستگی به داده وارد‌شده دارد) */
export function fullExamBlueprint(): ExamBlueprint {
  return {
    mode: 'full',
    counts: Object.fromEntries(SUBJECTS.map((s) => [s.id, s.fullExamCount])),
    durationSec: FULL_EXAM_DURATION_SEC,
  };
}

/** آزمون تک‌مضمونی: زمان متناسب با نسبت آزمون کامل */
export function subjectBlueprint(subject: SubjectId, count: number): ExamBlueprint {
  return {
    mode: 'subject',
    counts: { [subject]: count },
    durationSec: Math.max(60, Math.round(count * (FULL_EXAM_DURATION_SEC / (FULL_EXAM_TOTAL || 1)))),
  };
}
