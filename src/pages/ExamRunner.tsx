import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ActiveExam } from '../data/schema';
import { getQuestions } from '../db/questions';
import {
  clearActiveExam,
  finishExam,
  getActiveExam,
  saveActiveExam,
} from '../db/examSession';
import QuestionView from '../components/QuestionView';
import { faDuration, faNum } from '../lib/format';

export default function ExamRunner() {
  const navigate = useNavigate();
  const [exam, setExam] = useState<ActiveExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [remaining, setRemaining] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    getActiveExam().then((a) => {
      setExam(a ?? null);
      setLoading(false);
    });
  }, []);

  const submit = useCallback(async () => {
    if (submittingRef.current || !exam) return;
    submittingRef.current = true;
    const id = await finishExam(exam);
    navigate(`/report/${id}`, { replace: true });
  }, [exam, navigate]);

  // تایمر بر پایه deadline — با رفرش دقیق می‌ماند و در پایان وقت خودکار ثبت می‌کند
  useEffect(() => {
    if (!exam) return;
    const tick = () => {
      const left = Math.max(0, Math.round((exam.deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) void submit();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [exam, submit]);

  const update = (patch: Partial<ActiveExam>) => {
    setExam((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      void saveActiveExam(next);
      return next;
    });
  };

  if (loading) return <p className="muted">در حال بارگذاری…</p>;

  if (!exam) {
    return (
      <div className="empty-state">
        <span className="emoji">📝</span>
        <p>آزمون فعالی وجود ندارد.</p>
        <button className="btn btn-primary" onClick={() => navigate('/exam')}>
          شروع آزمون جدید
        </button>
      </div>
    );
  }

  const questions = getQuestions(exam.questionIds);
  const q = questions[exam.currentIndex];
  const selected = exam.answers[q.id] ?? null;
  const answeredCount = Object.values(exam.answers).filter((v) => v !== null).length;
  const isFlagged = exam.flagged.includes(q.id);

  const selectAnswer = (i: number) => update({ answers: { ...exam.answers, [q.id]: i } });

  const toggleFlag = () =>
    update({
      flagged: isFlagged ? exam.flagged.filter((id) => id !== q.id) : [...exam.flagged, q.id],
    });

  const go = (index: number) => {
    update({ currentIndex: Math.max(0, Math.min(questions.length - 1, index)) });
    setShowGrid(false);
  };

  const cancel = async () => {
    if (!confirm('آزمون لغو شود؟ پیشرفت این آزمون ذخیره نمی‌شود.')) return;
    await clearActiveExam();
    navigate('/exam');
  };

  const lowTime = remaining <= 60;

  return (
    <div className="stack">
      <div className="row spread">
        <button className="btn" onClick={cancel}>
          لغو
        </button>
        <span className={`exam-timer ${lowTime ? 'warning' : ''}`}>⏱ {faDuration(remaining)}</span>
        <button className="btn" onClick={() => setShowGrid((s) => !s)}>
          {faNum(answeredCount)}/{faNum(questions.length)}
        </button>
      </div>

      {showGrid && (
        <div className="card">
          <p className="small muted">پیمایش سؤالات (پرچم‌دارها با حاشیه نارنجی)</p>
          <div className="q-grid">
            {questions.map((qq, i) => {
              const cls = [
                'q-grid-cell',
                exam.answers[qq.id] != null ? 'answered' : '',
                exam.flagged.includes(qq.id) ? 'flagged' : '',
                i === exam.currentIndex ? 'current' : '',
              ].join(' ');
              return (
                <button key={qq.id} className={cls} onClick={() => go(i)}>
                  {faNum(i + 1)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="card">
        <div className="row spread" style={{ marginBottom: 'var(--space-2)' }}>
          <span className="small muted">
            {answeredCount === questions.length ? 'همه سؤالات جواب داده شده' : ''}
          </span>
          <button className={`chip chip-btn ${isFlagged ? 'active' : ''}`} onClick={toggleFlag}>
            {isFlagged ? '🚩 پرچم‌دار' : '🏳 پرچم'}
          </button>
        </div>
        <QuestionView
          question={q}
          index={exam.currentIndex}
          total={questions.length}
          selected={selected}
          revealed={false}
          onSelect={selectAnswer}
        />
      </div>

      <div className="row spread">
        <button
          className="btn"
          onClick={() => go(exam.currentIndex - 1)}
          disabled={exam.currentIndex === 0}
        >
          → قبلی
        </button>
        {exam.currentIndex < questions.length - 1 ? (
          <button className="btn btn-primary" onClick={() => go(exam.currentIndex + 1)}>
            بعدی ←
          </button>
        ) : (
          <button className="btn btn-primary" onClick={submit}>
            ثبت و پایان آزمون
          </button>
        )}
      </div>

      {exam.currentIndex < questions.length - 1 && (
        <button className="btn" onClick={submit}>
          ثبت زودهنگام آزمون
        </button>
      )}
    </div>
  );
}
