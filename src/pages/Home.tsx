import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db/db';
import { dueCount } from '../db/reviewQueue';
import { getActiveExam } from '../db/examSession';
import { ALL_QUESTIONS } from '../data/bank';
import type { Attempt } from '../data/schema';
import { faNum, faPercent } from '../lib/format';

export default function Home() {
  const [due, setDue] = useState(0);
  const [lastAttempt, setLastAttempt] = useState<Attempt | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [hasActive, setHasActive] = useState(false);

  useEffect(() => {
    (async () => {
      setDue(await dueCount());
      const attempts = await db.attempts.orderBy('finishedAt').reverse().toArray();
      setLastAttempt(attempts[0] ?? null);
      setAttemptCount(attempts.length);
      setHasActive(!!(await getActiveExam()));
    })();
  }, []);

  return (
    <div className="stack">
      <section className="card">
        <h1 className="page-title">به آمادگی کانکور خوش آمدید 🎓</h1>
        <p className="muted">
          بانک سؤالات، شبیه‌ساز آزمون با تایمر، کارنامه هوشمند و مرور فاصله‌دار — همه کاملاً آفلاین.
        </p>
        <div className="row">
          {hasActive ? (
            <Link to="/exam/run" className="btn btn-primary btn-lg">ادامه آزمون نیمه‌کاره</Link>
          ) : (
            <Link to="/exam" className="btn btn-primary btn-lg">شروع آزمون</Link>
          )}
          <Link to="/bank" className="btn btn-lg">تمرین سؤالات</Link>
        </div>
      </section>

      <div className="stat-tiles">
        <Link to="/review" className="stat-tile" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-value" style={{ color: due > 0 ? 'var(--saffron)' : 'var(--text)' }}>
            {faNum(due)}
          </div>
          <div className="stat-label">کارت آماده مرور</div>
        </Link>
        <div className="stat-tile">
          <div className="stat-value">{faNum(attemptCount)}</div>
          <div className="stat-label">آزمون داده‌شده</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{faNum(ALL_QUESTIONS.length)}</div>
          <div className="stat-label">سؤال در بانک</div>
        </div>
      </div>

      {due > 0 && (
        <Link to="/review" className="card select-card" style={{ display: 'block' }}>
          <div className="row spread">
            <span>🔁 {faNum(due)} کارت برای مرور امروز آماده است</span>
            <span className="chip active">مرور کن ←</span>
          </div>
        </Link>
      )}

      {lastAttempt && (
        <div className="card">
          <h3>آخرین کارنامه</h3>
          <div className="row spread">
            <span className="muted">
              نمره: {faNum(lastAttempt.score)} از {faNum(lastAttempt.total)} ·{' '}
              {faPercent(lastAttempt.total ? lastAttempt.score / lastAttempt.total : 0)}
            </span>
            <Link to={`/report/${lastAttempt.id}`} className="btn">مشاهده</Link>
          </div>
        </div>
      )}
    </div>
  );
}
