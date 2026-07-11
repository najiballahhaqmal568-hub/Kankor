import { describe, expect, it } from 'vitest';
import { buildExam, gradeExam, pickRandom } from './examEngine';
import type { ExamBlueprint, Question } from '../data/schema';

function q(id: string, subject: Question['subject'], correctIndex: 0 | 1 | 2 | 3): Question {
  return {
    id,
    subject,
    topic: 't',
    difficulty: 1,
    stem: 's',
    options: [
      { text: 'a', explanation: '' },
      { text: 'b', explanation: '' },
      { text: 'c', explanation: '' },
      { text: 'd', explanation: '' },
    ],
    correctIndex,
    studyHint: 'h',
  };
}

// مولد اعداد شبه‌تصادفی قابل تکرار
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

describe('pickRandom', () => {
  it('به تعداد خواسته‌شده و بدون تکرار برمی‌گرداند', () => {
    const items = [1, 2, 3, 4, 5];
    const picked = pickRandom(items, 3, seededRng(1));
    expect(picked).toHaveLength(3);
    expect(new Set(picked).size).toBe(3);
  });

  it('اگر n بیشتر از طول باشد، همه را برمی‌گرداند', () => {
    expect(pickRandom([1, 2], 5)).toHaveLength(2);
  });

  it('آرایه اصلی را تغییر نمی‌دهد', () => {
    const items = [1, 2, 3];
    pickRandom(items, 2, seededRng(3));
    expect(items).toEqual([1, 2, 3]);
  });
});

describe('buildExam', () => {
  const bank = [
    q('m1', 'math', 0),
    q('m2', 'math', 1),
    q('m3', 'math', 2),
    q('p1', 'physics', 0),
    q('p2', 'physics', 1),
  ];

  it('از هر مضمون به تعداد خواسته‌شده انتخاب می‌کند', () => {
    const bp: ExamBlueprint = { mode: 'custom', counts: { math: 2, physics: 1 }, durationSec: 60 };
    const exam = buildExam(bp, bank, seededRng(5));
    expect(exam.filter((x) => x.subject === 'math')).toHaveLength(2);
    expect(exam.filter((x) => x.subject === 'physics')).toHaveLength(1);
  });

  it('اگر سؤال کافی نباشد، تا حد موجود برمی‌دارد', () => {
    const bp: ExamBlueprint = { mode: 'subject', counts: { physics: 10 }, durationSec: 60 };
    expect(buildExam(bp, bank)).toHaveLength(2);
  });
});

describe('gradeExam', () => {
  const questions = [q('m1', 'math', 0), q('m2', 'math', 1), q('p1', 'physics', 2)];
  const bp: ExamBlueprint = { mode: 'custom', counts: { math: 2, physics: 1 }, durationSec: 60 };

  it('نمره و تفکیک مضمون را درست محاسبه می‌کند', () => {
    const answers = { m1: 0, m2: 3, p1: null }; // درست، غلط، بی‌جواب
    const { attempt, answerRecords } = gradeExam('a1', bp, questions, answers, {
      startedAt: 1000,
      finishedAt: 61000,
    });
    expect(attempt.score).toBe(1);
    expect(attempt.total).toBe(3);
    expect(attempt.durationSec).toBe(60);

    const math = attempt.perSubject.find((s) => s.subject === 'math')!;
    expect(math).toMatchObject({ total: 2, correct: 1, wrong: 1, unanswered: 0 });
    const physics = attempt.perSubject.find((s) => s.subject === 'physics')!;
    expect(physics).toMatchObject({ total: 1, correct: 0, wrong: 0, unanswered: 1 });

    expect(answerRecords).toHaveLength(3);
    expect(answerRecords.find((r) => r.questionId === 'p1')!.selectedIndex).toBeNull();
  });

  it('نمره کامل برای همه پاسخ‌های درست', () => {
    const answers = { m1: 0, m2: 1, p1: 2 };
    const { attempt } = gradeExam('a2', bp, questions, answers, {
      startedAt: 0,
      finishedAt: 1000,
    });
    expect(attempt.score).toBe(3);
  });
});
