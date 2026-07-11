import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Question, SrsCard } from '../data/schema';
import { getQuestion } from '../db/questions';
import { dueCards, gradeCard } from '../db/reviewQueue';
import QuestionView from '../components/QuestionView';
import { faNum } from '../lib/format';

interface DueItem {
  card: SrsCard;
  question: Question;
}

export default function Review() {
  const [queue, setQueue] = useState<DueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pos, setPos] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [reviewedCount, setReviewedCount] = useState(0);

  const load = useCallback(async () => {
    const cards = await dueCards();
    const items: DueItem[] = [];
    for (const card of cards) {
      const q = getQuestion(card.questionId);
      if (q) items.push({ card, question: q });
    }
    setQueue(items);
    setPos(0);
    setSelected(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const current = queue[pos];

  const grade = async (quality: number) => {
    if (!current) return;
    await gradeCard(current.question.id, quality);
    setReviewedCount((c) => c + 1);
    if (pos + 1 >= queue.length) {
      setPos(queue.length); // پایان
    } else {
      setPos((p) => p + 1);
      setSelected(null);
    }
  };

  if (loading) return <p className="muted">در حال بارگذاری…</p>;

  // حالت خالی
  if (queue.length === 0) {
    return (
      <div className="stack">
        <h1 className="page-title">مرور فاصله‌دار</h1>
        <div className="empty-state card">
          <span className="emoji">🎉</span>
          <p>هیچ کارتی برای مرور امروز ندارید!</p>
          <p className="small muted">
            سؤال‌هایی که در تمرین یا آزمون غلط جواب دهید، خودکار به این صف اضافه می‌شوند.
          </p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <Link to="/bank" className="btn btn-primary">تمرین سؤالات</Link>
            <Link to="/exam" className="btn">شروع آزمون</Link>
          </div>
        </div>
      </div>
    );
  }

  // پایان جلسه
  if (pos >= queue.length) {
    return (
      <div className="stack">
        <h1 className="page-title">مرور فاصله‌دار</h1>
        <div className="empty-state card">
          <span className="emoji">✅</span>
          <p>آفرین! {faNum(reviewedCount)} کارت را مرور کردید.</p>
          <button className="btn btn-primary" onClick={load}>
            بررسی دوباره صف
          </button>
        </div>
      </div>
    );
  }

  const q = current.question;
  const correct = selected === q.correctIndex;

  return (
    <div className="stack">
      <div className="row spread">
        <h1 className="page-title" style={{ margin: 0 }}>مرور فاصله‌دار</h1>
        <span className="chip">
          {faNum(pos + 1)} از {faNum(queue.length)}
        </span>
      </div>

      <div className="card">
        <QuestionView
          question={q}
          selected={selected}
          revealed={selected != null}
          onSelect={(i) => setSelected(i)}
        />
      </div>

      {selected == null ? (
        <p className="small muted">گزینه‌ای را برای یادآوری انتخاب کنید.</p>
      ) : correct ? (
        <div className="stack">
          <p className="small" style={{ color: 'var(--correct)', margin: 0 }}>
            درست! این کارت چقدر برایتان آسان بود؟
          </p>
          <div className="row">
            <button className="btn grow" onClick={() => grade(3)}>سخت</button>
            <button className="btn grow" onClick={() => grade(4)}>خوب</button>
            <button className="btn btn-primary grow" onClick={() => grade(5)}>آسان</button>
          </div>
        </div>
      ) : (
        <div className="stack">
          <p className="small" style={{ color: 'var(--wrong)', margin: 0 }}>
            اشکالی ندارد؛ توضیح را مرور کنید. این کارت به‌زودی دوباره می‌آید.
          </p>
          <button className="btn btn-primary" onClick={() => grade(2)}>
            متوجه شدم، کارت بعدی ←
          </button>
        </div>
      )}
    </div>
  );
}
