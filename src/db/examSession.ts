import { db } from './db';
import { getQuestions } from './questions';
import { ALL_QUESTIONS } from '../data/bank';
import { buildExam, gradeExam } from '../logic/examEngine';
import { enqueueForReview } from './reviewQueue';
import type { ActiveExam, ExamBlueprint } from '../data/schema';

/** یک آزمون تازه می‌سازد و در جدول activeExam ذخیره می‌کند */
export async function startExam(blueprint: ExamBlueprint): Promise<ActiveExam> {
  const questions = buildExam(blueprint, ALL_QUESTIONS);
  const now = Date.now();
  const active: ActiveExam = {
    attemptId: `exam-${now}`,
    mode: blueprint.mode,
    blueprint,
    questionIds: questions.map((q) => q.id),
    startedAt: now,
    deadline: now + blueprint.durationSec * 1000,
    answers: {},
    flagged: [],
    currentIndex: 0,
  };
  // فقط یک آزمون فعال در هر زمان
  await db.activeExam.clear();
  await db.activeExam.put(active);
  return active;
}

export async function getActiveExam(): Promise<ActiveExam | undefined> {
  return db.activeExam.toCollection().first();
}

export async function saveActiveExam(active: ActiveExam): Promise<void> {
  await db.activeExam.put(active);
}

export async function clearActiveExam(): Promise<void> {
  await db.activeExam.clear();
}

/**
 * آزمون در جریان را نمره‌دهی و ثبت می‌کند، سؤال‌های غلط را به صف مرور می‌فرستد،
 * و آزمون فعال را پاک می‌کند. شناسه attempt برای رفتن به کارنامه برمی‌گردد.
 */
export async function finishExam(active: ActiveExam): Promise<string> {
  const questions = getQuestions(active.questionIds);
  const finishedAt = Math.min(Date.now(), active.deadline);
  const { attempt, answerRecords } = gradeExam(
    active.attemptId,
    active.blueprint,
    questions,
    active.answers,
    { startedAt: active.startedAt, finishedAt },
  );

  await db.transaction('rw', db.attempts, db.answers, db.srsCards, db.activeExam, async () => {
    await db.attempts.put(attempt);
    await db.answers.bulkPut(answerRecords);
    for (const rec of answerRecords) {
      if (!rec.correct) await enqueueForReview(rec.questionId, rec.subject);
    }
    await db.activeExam.clear();
  });

  return attempt.id;
}
