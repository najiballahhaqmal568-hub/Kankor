import type { AnswerRecord, Attempt, Question, SubjectId } from '../data/schema';

export interface TopicStat {
  subject: SubjectId;
  topic: string;
  total: number;
  correct: number;
  ratio: number;
}

export interface StudyGroup {
  subject: SubjectId;
  items: { questionId: string; topic: string; hint: string }[];
}

/** بازه عملکرد برای رنگ‌بندی نمودار (سبز/زعفرانی/سرخ) */
export type PerfBand = 'good' | 'mid' | 'weak';

export function perfBand(ratio: number): PerfBand {
  if (ratio >= 0.75) return 'good';
  if (ratio >= 0.5) return 'mid';
  return 'weak';
}

/** تفکیک عملکرد بر اساس مبحث (topic) */
export function topicBreakdown(
  answers: AnswerRecord[],
  lookup: (id: string) => Question | undefined,
): TopicStat[] {
  const map = new Map<string, TopicStat>();
  for (const a of answers) {
    const q = lookup(a.questionId);
    if (!q) continue;
    const key = `${q.subject}::${q.topic}`;
    let stat = map.get(key);
    if (!stat) {
      stat = { subject: q.subject, topic: q.topic, total: 0, correct: 0, ratio: 0 };
      map.set(key, stat);
    }
    stat.total++;
    if (a.correct) stat.correct++;
  }
  for (const stat of map.values()) {
    stat.ratio = stat.total ? stat.correct / stat.total : 0;
  }
  return Array.from(map.values());
}

/** ضعیف‌ترین مباحث: آن‌هایی که حداقل یک غلط دارند، مرتب‌شده از ضعیف به قوی */
export function weakestTopics(topics: TopicStat[], limit = 5): TopicStat[] {
  return topics
    .filter((t) => t.correct < t.total)
    .sort((a, b) => a.ratio - b.ratio || b.total - a.total)
    .slice(0, limit);
}

/**
 * پیشنهادهای مطالعه: برای هر سؤال غلط، studyHint آن را بر اساس مضمون گروه‌بندی می‌کند.
 * هر پیشنهاد یکتا (بر اساس متن hint) در هر مضمون فقط یک‌بار می‌آید.
 */
export function studyRecommendations(
  answers: AnswerRecord[],
  lookup: (id: string) => Question | undefined,
): StudyGroup[] {
  const bySubject = new Map<SubjectId, StudyGroup>();
  const seenHints = new Set<string>();
  for (const a of answers) {
    if (a.correct) continue;
    const q = lookup(a.questionId);
    if (!q) continue;
    const hintKey = `${q.subject}::${q.studyHint}`;
    if (seenHints.has(hintKey)) continue;
    seenHints.add(hintKey);

    let group = bySubject.get(q.subject);
    if (!group) {
      group = { subject: q.subject, items: [] };
      bySubject.set(q.subject, group);
    }
    group.items.push({ questionId: q.id, topic: q.topic, hint: q.studyHint });
  }
  return Array.from(bySubject.values());
}

/** پیام کلی بر اساس درصد کل */
export function overallMessage(attempt: Attempt): string {
  const ratio = attempt.total ? attempt.score / attempt.total : 0;
  if (ratio >= 0.85) return 'عالی! آمادگی شما بسیار خوب است. 🌟';
  if (ratio >= 0.7) return 'خوب است، اما هنوز جای پیشرفت دارید. 💪';
  if (ratio >= 0.5) return 'متوسط — روی مباحث ضعیف تمرکز کنید. 📈';
  return 'نیاز به مطالعه بیشتر دارید؛ ناامید نشوید و ادامه دهید. 📚';
}
