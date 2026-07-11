import type { ExamBlueprint, Subject, SubjectId } from './schema';

/**
 * مضامین کانکور و وزن هر مضمون در آزمون کامل.
 * ساختار آزمون کامل: ۱۶۰ سؤال / ۱۸۰ دقیقه.
 * اگر ساختار رسمی کانکور تغییر کرد فقط همین فایل به‌روز شود (ADR-006).
 */
export const SUBJECTS: Subject[] = [
  { id: 'math', name: 'ریاضی', icon: '📐', fullExamCount: 30 },
  { id: 'physics', name: 'فزیک', icon: '⚛️', fullExamCount: 25 },
  { id: 'chemistry', name: 'کیمیا', icon: '🧪', fullExamCount: 25 },
  { id: 'biology', name: 'بیولوژی', icon: '🧬', fullExamCount: 25 },
  { id: 'dari', name: 'دری', icon: '📖', fullExamCount: 10 },
  { id: 'pashto', name: 'پشتو', icon: '📜', fullExamCount: 10 },
  { id: 'english', name: 'انگلیسی', icon: '🔤', fullExamCount: 10 },
  { id: 'islamic', name: 'علوم دینی', icon: '🕌', fullExamCount: 10 },
  { id: 'history', name: 'تاریخ', icon: '🏛️', fullExamCount: 8 },
  { id: 'geography', name: 'جغرافیه', icon: '🗺️', fullExamCount: 7 },
];

export const SUBJECT_MAP: Record<SubjectId, Subject> = Object.fromEntries(
  SUBJECTS.map((s) => [s.id, s]),
) as Record<SubjectId, Subject>;

export const FULL_EXAM_DURATION_SEC = 180 * 60;

export const FULL_EXAM_TOTAL = SUBJECTS.reduce((sum, s) => sum + s.fullExamCount, 0);

export function fullExamBlueprint(): ExamBlueprint {
  return {
    mode: 'full',
    counts: Object.fromEntries(SUBJECTS.map((s) => [s.id, s.fullExamCount])),
    durationSec: FULL_EXAM_DURATION_SEC,
  };
}

/** آزمون تک‌مضمونی: هر سؤال حدود ۶۷ ثانیه (نسبت همان آزمون کامل) */
export function subjectBlueprint(subject: SubjectId, count: number): ExamBlueprint {
  return {
    mode: 'subject',
    counts: { [subject]: count },
    durationSec: Math.round(count * (FULL_EXAM_DURATION_SEC / FULL_EXAM_TOTAL)),
  };
}
