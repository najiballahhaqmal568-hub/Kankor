/**
 * شناسه مضمون — مستقیماً همان مقدار فیلد `subject` در questions.json (نام دری).
 * enum ثابت عمداً وجود ندارد: مضامین از خودِ داده استخراج می‌شوند تا افزودن
 * بچ‌های بعدی سؤالات (با مضامین جدید) بدون تغییر کد ممکن باشد.
 */
export type SubjectId = string;

export interface Subject {
  id: SubjectId;
  /** نام دری برای نمایش — همان id */
  name: string;
  icon: string;
  /** تعداد سؤال این مضمون موجود در بانک فعلی */
  fullExamCount: number;
}

/** سطح سختی — دقیقاً همان مقدار متنی questions.json */
export type Difficulty = string;

export interface QuestionOption {
  text: string;
  correct: boolean;
  /** فقط روی گزینه درست: چرا این گزینه درست است */
  why_correct?: string;
  /** فقط روی گزینه‌های غلط: چرا این گزینه غلط است */
  why_wrong?: string;
}

/** ساختار دقیق یک سؤال — منطبق بر questions.json (بدون هیچ فیلد اضافه یا حذف‌شده) */
export interface Question {
  id: string;
  subject: SubjectId;
  topic: string;
  difficulty: Difficulty;
  question: string;
  /** حداقل ۲ گزینه؛ دقیقاً یکی correct=true */
  options: QuestionOption[];
  /** چرا پاسخ درست، درست است — همیشه نمایش داده می‌شود */
  explanation: string;
  /** ارجاع به فصل/کتاب درسی برای پیشنهاد مطالعه */
  chapter_ref: string;
  language: string;
  source: string;
  /** فقط سؤالات verified=true در پروداکشن نمایش داده می‌شوند */
  verified: boolean;
}

/** اندیس گزینه درست — از روی داده محاسبه می‌شود، هرگز ذخیره یا هاردکد نمی‌شود */
export function getCorrectIndex(q: Question): number {
  return q.options.findIndex((o) => o.correct);
}

/** نوع آزمون */
export type ExamMode = 'full' | 'subject' | 'custom';

/** نقشه ساخت یک آزمون */
export interface ExamBlueprint {
  mode: ExamMode;
  /** تعداد سؤال از هر مضمون */
  counts: Partial<Record<SubjectId, number>>;
  durationSec: number;
}

/** پاسخ کاربر به یک سؤال در یک آزمون */
export interface AnswerRecord {
  id?: number;
  attemptId: string;
  questionId: string;
  subject: SubjectId;
  /** null = بی‌جواب */
  selectedIndex: number | null;
  correct: boolean;
  timeSpentSec: number;
}

export interface SubjectResult {
  subject: SubjectId;
  total: number;
  correct: number;
  wrong: number;
  unanswered: number;
}

/** یک آزمون ثبت‌شده */
export interface Attempt {
  id: string;
  mode: ExamMode;
  blueprint: ExamBlueprint;
  questionIds: string[];
  startedAt: number;
  finishedAt: number;
  durationSec: number;
  score: number;
  total: number;
  perSubject: SubjectResult[];
}

/** وضعیت آزمونِ در جریان (برای ادامه بعد از بستن اپ) */
export interface ActiveExam {
  attemptId: string;
  mode: ExamMode;
  blueprint: ExamBlueprint;
  questionIds: string[];
  startedAt: number;
  /** پایان مهلت بر پایه timestamp — تایمر با رفرش دقیق می‌ماند */
  deadline: number;
  answers: Record<string, number | null>;
  flagged: string[];
  currentIndex: number;
}

/** کارت مرور فاصله‌دار — الگوریتم SM-2 */
export interface SrsCard {
  questionId: string;
  subject: SubjectId;
  /** ضریب آسانی (EF) — حداقل ۱.۳ */
  easiness: number;
  intervalDays: number;
  repetitions: number;
  /** timestamp سررسید مرور بعدی */
  dueDate: number;
  lastQuality: number;
  addedAt: number;
}
