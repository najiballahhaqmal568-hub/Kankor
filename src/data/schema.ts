/** شناسه مضامین کانکور */
export type SubjectId =
  | 'math'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'dari'
  | 'pashto'
  | 'english'
  | 'islamic'
  | 'history'
  | 'geography';

export interface Subject {
  id: SubjectId;
  /** نام دری برای نمایش */
  name: string;
  icon: string;
  /** تعداد سؤال این مضمون در آزمون کامل کانکور */
  fullExamCount: number;
}

export interface QuestionOption {
  text: string;
  /** چرا این گزینه درست/غلط است — برای کارنامه هوشمند */
  explanation: string;
}

export interface Question {
  id: string;
  subject: SubjectId;
  /** فصل/مبحث، مثلاً «مثلثات» */
  topic: string;
  /** ۱=آسان ۲=متوسط ۳=سخت */
  difficulty: 1 | 2 | 3;
  stem: string;
  /** دقیقاً ۴ گزینه */
  options: QuestionOption[];
  correctIndex: 0 | 1 | 2 | 3;
  /** پیشنهاد مطالعه، مثلاً «کتاب ریاضی صنف ۱۲، فصل ۳» */
  studyHint: string;
  /** سال کانکور، اگر سؤال سال‌های گذشته باشد */
  year?: number;
  tags?: string[];
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
