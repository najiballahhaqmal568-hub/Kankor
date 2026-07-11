import type {
  AnswerRecord,
  Attempt,
  ExamBlueprint,
  Question,
  SubjectId,
  SubjectResult,
} from '../data/schema';

/** انتخاب تصادفی n عنصر از یک آرایه (بدون تغییر آرایه اصلی) */
export function pickRandom<T>(items: T[], n: number, rng: () => number = Math.random): T[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(n, pool.length));
}

/**
 * ساخت فهرست سؤالات یک آزمون از روی blueprint.
 * برای هر مضمون به تعداد خواسته‌شده سؤال تصادفی برمی‌گزیند (تا حد موجود).
 */
export function buildExam(
  blueprint: ExamBlueprint,
  bank: Question[],
  rng: () => number = Math.random,
): Question[] {
  const result: Question[] = [];
  for (const [subject, count] of Object.entries(blueprint.counts)) {
    if (!count) continue;
    const pool = bank.filter((q) => q.subject === (subject as SubjectId));
    result.push(...pickRandom(pool, count, rng));
  }
  return result;
}

/**
 * نمره‌دهی آزمون و تولید تحلیل مضمون‌به‌مضمون.
 * answers: نگاشت questionId → گزینه انتخابی (null = بی‌جواب).
 */
export function gradeExam(
  attemptId: string,
  blueprint: ExamBlueprint,
  questions: Question[],
  answers: Record<string, number | null>,
  timing: { startedAt: number; finishedAt: number },
  timePerQuestion: Record<string, number> = {},
): { attempt: Attempt; answerRecords: AnswerRecord[] } {
  const perSubjectMap = new Map<SubjectId, SubjectResult>();
  const answerRecords: AnswerRecord[] = [];
  let score = 0;

  for (const q of questions) {
    const selected = answers[q.id] ?? null;
    const correct = selected === q.correctIndex;
    if (correct) score++;

    let bucket = perSubjectMap.get(q.subject);
    if (!bucket) {
      bucket = { subject: q.subject, total: 0, correct: 0, wrong: 0, unanswered: 0 };
      perSubjectMap.set(q.subject, bucket);
    }
    bucket.total++;
    if (selected === null) bucket.unanswered++;
    else if (correct) bucket.correct++;
    else bucket.wrong++;

    answerRecords.push({
      attemptId,
      questionId: q.id,
      subject: q.subject,
      selectedIndex: selected,
      correct,
      timeSpentSec: Math.round(timePerQuestion[q.id] ?? 0),
    });
  }

  const attempt: Attempt = {
    id: attemptId,
    mode: blueprint.mode,
    blueprint,
    questionIds: questions.map((q) => q.id),
    startedAt: timing.startedAt,
    finishedAt: timing.finishedAt,
    durationSec: Math.round((timing.finishedAt - timing.startedAt) / 1000),
    score,
    total: questions.length,
    perSubject: Array.from(perSubjectMap.values()),
  };

  return { attempt, answerRecords };
}
