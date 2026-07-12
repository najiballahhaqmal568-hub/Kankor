import { useMemo, useState } from 'react';
import { ALL_QUESTIONS } from '../data/bank';
import { SUBJECTS } from '../data/subjects';
import type { Question, SubjectId } from '../data/schema';
import { getCorrectIndex } from '../data/schema';
import QuestionView from '../components/QuestionView';
import { enqueueForReview } from '../db/reviewQueue';
import { faNum } from '../lib/format';

export default function Bank() {
  const [subject, setSubject] = useState<SubjectId | 'all'>('all');
  const [topic, setTopic] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<string>('all');

  // حالت تمرین
  const [practice, setPractice] = useState<Question[] | null>(null);
  const [pIndex, setPIndex] = useState(0);
  const [pSelected, setPSelected] = useState<number | null>(null);
  const [pCorrect, setPCorrect] = useState(0);

  const topics = useMemo(() => {
    const set = new Set<string>();
    ALL_QUESTIONS.forEach((q) => {
      if (subject === 'all' || q.subject === subject) set.add(q.topic);
    });
    return Array.from(set);
  }, [subject]);

  const difficulties = useMemo(() => {
    const set = new Set<string>();
    ALL_QUESTIONS.forEach((q) => {
      if (subject === 'all' || q.subject === subject) set.add(q.difficulty);
    });
    return Array.from(set);
  }, [subject]);

  const filtered = useMemo(
    () =>
      ALL_QUESTIONS.filter(
        (q) =>
          (subject === 'all' || q.subject === subject) &&
          (topic === 'all' || q.topic === topic) &&
          (difficulty === 'all' || q.difficulty === difficulty),
      ),
    [subject, topic, difficulty],
  );

  const startPractice = () => {
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    setPractice(shuffled);
    setPIndex(0);
    setPSelected(null);
    setPCorrect(0);
  };

  const answer = async (i: number) => {
    if (pSelected != null || !practice) return;
    setPSelected(i);
    const q = practice[pIndex];
    if (i === getCorrectIndex(q)) {
      setPCorrect((c) => c + 1);
    } else {
      await enqueueForReview(q.id, q.subject);
    }
  };

  const next = () => {
    if (!practice) return;
    if (pIndex + 1 >= practice.length) {
      setPractice(null);
      return;
    }
    setPIndex((n) => n + 1);
    setPSelected(null);
  };

  // ---------- نمای تمرین ----------
  if (practice) {
    const q = practice[pIndex];
    const finished = pIndex + 1 >= practice.length && pSelected != null;
    return (
      <div className="stack">
        <div className="row spread">
          <button className="btn" onClick={() => setPractice(null)}>
            ← پایان تمرین
          </button>
          <span className="chip">
            درست: {faNum(pCorrect)} از {faNum(pIndex + (pSelected != null ? 1 : 0))}
          </span>
        </div>
        <div className="card">
          <QuestionView
            question={q}
            index={pIndex}
            total={practice.length}
            selected={pSelected}
            revealed={pSelected != null}
            onSelect={answer}
          />
        </div>
        {pSelected != null && (
          <button className="btn btn-primary btn-lg" onClick={next}>
            {finished ? 'پایان و بازگشت' : 'سؤال بعدی ←'}
          </button>
        )}
      </div>
    );
  }

  // ---------- نمای فیلتر ----------
  return (
    <div className="stack">
      <h1 className="page-title">بانک سؤالات</h1>

      <div className="card stack">
        <div>
          <p className="small muted">مضمون</p>
          <div className="filter-group">
            <button
              className={`chip chip-btn ${subject === 'all' ? 'active' : ''}`}
              onClick={() => {
                setSubject('all');
                setTopic('all');
                setDifficulty('all');
              }}
            >
              همه
            </button>
            {SUBJECTS.map((s) => (
              <button
                key={s.id}
                className={`chip chip-btn ${subject === s.id ? 'active' : ''}`}
                onClick={() => {
                  setSubject(s.id);
                  setTopic('all');
                  setDifficulty('all');
                }}
              >
                {s.icon} {s.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="small muted">مبحث</p>
          <div className="filter-group">
            <button
              className={`chip chip-btn ${topic === 'all' ? 'active' : ''}`}
              onClick={() => setTopic('all')}
            >
              همه
            </button>
            {topics.map((t) => (
              <button
                key={t}
                className={`chip chip-btn ${topic === t ? 'active' : ''}`}
                onClick={() => setTopic(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="small muted">سطح سختی</p>
          <div className="filter-group">
            <button
              className={`chip chip-btn ${difficulty === 'all' ? 'active' : ''}`}
              onClick={() => setDifficulty('all')}
            >
              همه
            </button>
            {difficulties.map((d) => (
              <button
                key={d}
                className={`chip chip-btn ${difficulty === d ? 'active' : ''}`}
                onClick={() => setDifficulty(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="row spread">
        <span className="muted">{faNum(filtered.length)} سؤال یافت شد</span>
        <button
          className="btn btn-primary btn-lg"
          onClick={startPractice}
          disabled={filtered.length === 0}
        >
          شروع تمرین
        </button>
      </div>
    </div>
  );
}
