import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SUBJECTS, fullExamBlueprint, subjectBlueprint } from '../data/subjects';
import { ALL_QUESTIONS } from '../data/bank';
import type { ExamBlueprint, ExamMode, SubjectId } from '../data/schema';
import { getActiveExam, startExam } from '../db/examSession';
import { faDuration, faNum } from '../lib/format';

const AVAILABLE: Record<string, number> = ALL_QUESTIONS.reduce((acc, q) => {
  acc[q.subject] = (acc[q.subject] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

export default function ExamSetup() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ExamMode>('full');
  const [subject, setSubject] = useState<SubjectId>('math');
  const [custom, setCustom] = useState<Partial<Record<SubjectId, number>>>({ math: 5, physics: 5 });
  const [hasActive, setHasActive] = useState(false);

  useEffect(() => {
    getActiveExam().then((a) => setHasActive(!!a));
  }, []);

  const blueprint: ExamBlueprint = useMemo(() => {
    if (mode === 'full') return fullExamBlueprint();
    if (mode === 'subject') {
      const count = Math.min(10, AVAILABLE[subject] || 0);
      return subjectBlueprint(subject, count);
    }
    const counts = Object.fromEntries(
      Object.entries(custom).filter(([, n]) => n && n > 0),
    ) as Partial<Record<SubjectId, number>>;
    const total = Object.values(counts).reduce((a, b) => a + (b || 0), 0);
    return { mode: 'custom', counts, durationSec: total * 60 };
  }, [mode, subject, custom]);

  const totalQuestions = Object.values(blueprint.counts).reduce((a, b) => a + (b || 0), 0);

  const begin = async () => {
    await startExam(blueprint);
    navigate('/exam/run');
  };

  return (
    <div className="stack">
      <h1 className="page-title">شبیه‌ساز آزمون</h1>

      {hasActive && (
        <div className="card" style={{ borderColor: 'var(--saffron)' }}>
          <p>یک آزمون نیمه‌کاره دارید.</p>
          <div className="row">
            <button className="btn btn-primary" onClick={() => navigate('/exam/run')}>
              ادامه آزمون
            </button>
          </div>
        </div>
      )}

      <div className="row" style={{ gap: 'var(--space-3)' }}>
        <button
          className={`card select-card grow ${mode === 'full' ? 'selected' : ''}`}
          onClick={() => setMode('full')}
        >
          <strong>آزمون کامل</strong>
          <p className="small muted">۱۶۰ سؤال · ۱۸۰ دقیقه</p>
        </button>
        <button
          className={`card select-card grow ${mode === 'subject' ? 'selected' : ''}`}
          onClick={() => setMode('subject')}
        >
          <strong>آزمون مضمونی</strong>
          <p className="small muted">تمرکز روی یک مضمون</p>
        </button>
        <button
          className={`card select-card grow ${mode === 'custom' ? 'selected' : ''}`}
          onClick={() => setMode('custom')}
        >
          <strong>آزمون سفارشی</strong>
          <p className="small muted">انتخاب مضامین و تعداد</p>
        </button>
      </div>

      {mode === 'subject' && (
        <div className="card">
          <p className="small muted">مضمون را انتخاب کنید</p>
          <div className="filter-group">
            {SUBJECTS.filter((s) => AVAILABLE[s.id]).map((s) => (
              <button
                key={s.id}
                className={`chip chip-btn ${subject === s.id ? 'active' : ''}`}
                onClick={() => setSubject(s.id)}
              >
                {s.icon} {s.name} ({faNum(AVAILABLE[s.id])})
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'custom' && (
        <div className="card stack">
          <p className="small muted">تعداد سؤال هر مضمون را تعیین کنید</p>
          {SUBJECTS.filter((s) => AVAILABLE[s.id]).map((s) => (
            <div key={s.id} className="row spread">
              <span>
                {s.icon} {s.name} <span className="muted small">(حداکثر {faNum(AVAILABLE[s.id])})</span>
              </span>
              <input
                type="number"
                min={0}
                max={AVAILABLE[s.id]}
                value={custom[s.id] ?? 0}
                style={{ width: '5rem' }}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(AVAILABLE[s.id], Number(e.target.value) || 0));
                  setCustom((c) => ({ ...c, [s.id]: v }));
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="card row spread">
        <div>
          <div className="small muted">تعداد سؤال</div>
          <strong>{faNum(totalQuestions)}</strong>
        </div>
        <div>
          <div className="small muted">زمان</div>
          <strong>{faDuration(blueprint.durationSec)}</strong>
        </div>
        <button className="btn btn-primary btn-lg" onClick={begin} disabled={totalQuestions === 0}>
          شروع آزمون
        </button>
      </div>
    </div>
  );
}
