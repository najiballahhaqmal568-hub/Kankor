import Dexie, { type Table } from 'dexie';
import type {
  ActiveExam,
  AnswerRecord,
  Attempt,
  Question,
  SrsCard,
} from '../data/schema';

export interface MetaRecord {
  key: string;
  value: number | string | boolean;
}

/**
 * پایگاه داده محلی اپ (IndexedDB از طریق Dexie).
 * محتوای سؤالات در جدول questions از JSON استاتیک seed می‌شود؛
 * بقیه جداول وضعیت کاربر را نگه می‌دارند (ADR-002).
 */
export class KankorDB extends Dexie {
  questions!: Table<Question, string>;
  attempts!: Table<Attempt, string>;
  answers!: Table<AnswerRecord, number>;
  srsCards!: Table<SrsCard, string>;
  activeExam!: Table<ActiveExam, string>;
  meta!: Table<MetaRecord, string>;

  constructor() {
    super('kankor');
    this.version(1).stores({
      questions: 'id, subject, topic, difficulty',
      attempts: 'id, mode, finishedAt',
      answers: '++id, attemptId, questionId, subject, correct',
      srsCards: 'questionId, subject, dueDate',
      activeExam: 'attemptId',
      meta: 'key',
    });
  }
}

export const db = new KankorDB();
