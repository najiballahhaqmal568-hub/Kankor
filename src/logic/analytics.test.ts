import { describe, expect, it } from 'vitest';
import {
  perfBand,
  studyRecommendations,
  topicBreakdown,
  weakestTopics,
} from './analytics';
import type { AnswerRecord, Question } from '../data/schema';

const questions: Record<string, Question> = {
  m1: mk('m1', 'math', 'الجبر', 'کتاب الجبر'),
  m2: mk('m2', 'math', 'الجبر', 'کتاب الجبر'),
  m3: mk('m3', 'math', 'هندسه', 'کتاب هندسه'),
  p1: mk('p1', 'physics', 'حرکت', 'کتاب فزیک'),
};

function mk(id: string, subject: Question['subject'], topic: string, hint: string): Question {
  return {
    id,
    subject,
    topic,
    difficulty: 1,
    stem: '',
    options: [
      { text: '', explanation: '' },
      { text: '', explanation: '' },
      { text: '', explanation: '' },
      { text: '', explanation: '' },
    ],
    correctIndex: 0,
    studyHint: hint,
  };
}

const lookup = (id: string) => questions[id];

function ans(questionId: string, correct: boolean): AnswerRecord {
  const q = questions[questionId];
  return {
    attemptId: 'a',
    questionId,
    subject: q.subject,
    selectedIndex: correct ? 0 : 1,
    correct,
    timeSpentSec: 0,
  };
}

describe('perfBand', () => {
  it('بازه‌ها را درست تشخیص می‌دهد', () => {
    expect(perfBand(0.9)).toBe('good');
    expect(perfBand(0.6)).toBe('mid');
    expect(perfBand(0.3)).toBe('weak');
  });
});

describe('topicBreakdown', () => {
  it('بر اساس مبحث تجمیع و نسبت را حساب می‌کند', () => {
    const answers = [ans('m1', true), ans('m2', false), ans('m3', true), ans('p1', false)];
    const topics = topicBreakdown(answers, lookup);
    const algebra = topics.find((t) => t.topic === 'الجبر')!;
    expect(algebra).toMatchObject({ total: 2, correct: 1 });
    expect(algebra.ratio).toBeCloseTo(0.5);
  });
});

describe('weakestTopics', () => {
  it('فقط مباحث دارای غلط را، از ضعیف به قوی، برمی‌گرداند', () => {
    const answers = [ans('m1', true), ans('m2', false), ans('m3', true), ans('p1', false)];
    const weak = weakestTopics(topicBreakdown(answers, lookup));
    // هندسه کامل درست است پس نباید بیاید
    expect(weak.map((t) => t.topic)).not.toContain('هندسه');
    // حرکت (۰٪) باید قبل از الجبر (۵۰٪) باشد
    expect(weak[0].topic).toBe('حرکت');
  });
});

describe('studyRecommendations', () => {
  it('پیشنهادها را بر اساس مضمون گروه‌بندی و hint تکراری را حذف می‌کند', () => {
    const answers = [ans('m1', false), ans('m2', false), ans('p1', false)];
    const groups = studyRecommendations(answers, lookup);
    const math = groups.find((g) => g.subject === 'math')!;
    // m1 و m2 هر دو hint یکسان دارند → فقط یک مورد
    expect(math.items).toHaveLength(1);
    expect(groups.find((g) => g.subject === 'physics')!.items).toHaveLength(1);
  });

  it('برای پاسخ درست پیشنهادی نمی‌دهد', () => {
    expect(studyRecommendations([ans('m1', true)], lookup)).toHaveLength(0);
  });
});
