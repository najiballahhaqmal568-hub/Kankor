import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { AnswerRecord, Attempt } from '../data/schema';
import { db } from '../db/db';
import { getQuestion } from '../db/questions';
import { SUBJECT_MAP } from '../data/subjects';
import {
  overallMessage,
  perfBand,
  studyRecommendations,
  topicBreakdown,
  weakestTopics,
} from '../logic/analytics';
import QuestionView from '../components/QuestionView';
import { faDate, faDuration, faNum, faPercent } from '../lib/format';

const BAND_COLOR: Record<string, string> = {
  good: 'var(--correct)',
  mid: 'var(--saffron)',
  weak: 'var(--wrong)',
};

export default function Report() {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuestions, setShowQuestions] = useState(false);

  useEffect(() => {
    if (!attemptId) return;
    (async () => {
      const a = await db.attempts.get(attemptId);
      const ans = await db.answers.where('attemptId').equals(attemptId).toArray();
      setAttempt(a ?? null);
      setAnswers(ans);
      setLoading(false);
    })();
  }, [attemptId]);

  if (loading) return <p className="muted">در حال بارگذاری…</p>;
  if (!attempt) {
    return (
      <div className="empty-state">
        <span className="emoji">🔍</span>
        <p>کارنامه یافت نشد.</p>
        <Link to="/exam" className="btn btn-primary">آزمون جدید</Link>
      </div>
    );
  }

  const ratio = attempt.total ? attempt.score / attempt.total : 0;
  const topics = topicBreakdown(answers, getQuestion);
  const weak = weakestTopics(topics);
  const study = studyRecommendations(answers, getQuestion);
  const answerMap = new Map(answers.map((a) => [a.questionId, a]));

  return (
    <div className="stack">
      <h1 className="page-title">کارنامه هوشمند</h1>

      {/* خلاصه */}
      <div className="card stack">
        <div className="stat-tiles">
          <div className="stat-tile">
            <div className="stat-value" style={{ color: BAND_COLOR[perfBand(ratio)] }}>
              {faPercent(ratio)}
            </div>
            <div className="stat-label">درصد کل</div>
          </div>
          <div className="stat-tile">
            <div className="stat-value">
              {faNum(attempt.score)}/{faNum(attempt.total)}
            </div>
            <div className="stat-label">پاسخ درست</div>
          </div>
          <div className="stat-tile">
            <div className="stat-value">{faDuration(attempt.durationSec)}</div>
            <div className="stat-label">زمان صرف‌شده</div>
          </div>
        </div>
        <p style={{ margin: 0, textAlign: 'center' }}>{overallMessage(attempt)}</p>
        <p className="small muted" style={{ margin: 0, textAlign: 'center' }}>
          {faDate(attempt.finishedAt)}
        </p>
      </div>

      {/* نمودار مضمون‌به‌مضمون */}
      <div className="card">
        <h3>تحلیل مضمون‌به‌مضمون</h3>
        {attempt.perSubject.map((s) => {
          const r = s.total ? s.correct / s.total : 0;
          return (
            <div key={s.subject} className="bar-row">
              <span className="small">
                {SUBJECT_MAP[s.subject].icon} {SUBJECT_MAP[s.subject].name}
              </span>
              <div
                className="bar-track"
                role="img"
                aria-label={`${SUBJECT_MAP[s.subject].name}: ${faPercent(r)}`}
              >
                <div
                  className="bar-fill"
                  style={{ width: `${r * 100}%`, background: BAND_COLOR[perfBand(r)] }}
                />
              </div>
              <span className="small" style={{ textAlign: 'start' }}>
                {faNum(s.correct)}/{faNum(s.total)}
              </span>
            </div>
          );
        })}
      </div>

      {/* ضعیف‌ترین مباحث */}
      {weak.length > 0 && (
        <div className="card">
          <h3>ضعیف‌ترین مباحث</h3>
          <div className="filter-group">
            {weak.map((t) => (
              <span
                key={`${t.subject}-${t.topic}`}
                className="chip"
                style={{ borderColor: BAND_COLOR[perfBand(t.ratio)] }}
              >
                {t.topic} · {faPercent(t.ratio)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* پیشنهاد مطالعه */}
      {study.length > 0 && (
        <div className="card">
          <h3>پیشنهاد مطالعه 📚</h3>
          {study.map((g) => (
            <div key={g.subject} style={{ marginBottom: 'var(--space-3)' }}>
              <strong className="small">
                {SUBJECT_MAP[g.subject].icon} {SUBJECT_MAP[g.subject].name}
              </strong>
              <ul style={{ margin: 'var(--space-1) 0', paddingInlineStart: '1.2rem' }}>
                {g.items.map((it) => (
                  <li key={it.questionId} className="small muted">
                    {it.hint}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* مرور سؤال‌به‌سؤال */}
      <button className="btn btn-lg" onClick={() => setShowQuestions((s) => !s)}>
        {showQuestions ? 'بستن مرور سؤالات' : 'مرور سؤال‌به‌سؤال با توضیح گزینه‌ها'}
      </button>
      {showQuestions && (
        <div className="stack">
          {attempt.questionIds.map((qid, i) => {
            const q = getQuestion(qid);
            if (!q) return null;
            const rec = answerMap.get(qid);
            return (
              <div key={qid} className="card">
                <QuestionView
                  question={q}
                  index={i}
                  total={attempt.questionIds.length}
                  selected={rec?.selectedIndex ?? null}
                  revealed
                />
                {rec?.selectedIndex == null && (
                  <p className="small" style={{ color: 'var(--unanswered)', margin: 0 }}>
                    این سؤال بی‌جواب ماند.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="row">
        <Link to="/exam" className="btn btn-primary">آزمون جدید</Link>
        <Link to="/review" className="btn">رفتن به مرور</Link>
      </div>
    </div>
  );
}
