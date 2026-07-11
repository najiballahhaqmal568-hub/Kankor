import type { Question } from '../data/schema';
import { SUBJECT_MAP } from '../data/subjects';
import { faNum } from '../lib/format';

const OPTION_LABELS = ['الف', 'ب', 'ج', 'د'];
const DIFFICULTY_LABEL = ['', 'آسان', 'متوسط', 'سخت'];

interface Props {
  question: Question;
  index?: number;
  total?: number;
  /** گزینه انتخاب‌شده کاربر (null = هنوز جواب نداده) */
  selected: number | null;
  /** آیا نتیجه/توضیح‌ها نمایش داده شود (حالت تمرین یا مرور کارنامه) */
  revealed: boolean;
  onSelect?: (index: number) => void;
}

export default function QuestionView({
  question,
  index,
  total,
  selected,
  revealed,
  onSelect,
}: Props) {
  const subject = SUBJECT_MAP[question.subject];

  return (
    <div className="question-view">
      <div className="row spread small muted">
        <span>
          {subject.icon} {subject.name} · {question.topic}
        </span>
        <span>
          {index != null && total != null && `سؤال ${faNum(index + 1)} از ${faNum(total)} · `}
          سختی: {DIFFICULTY_LABEL[question.difficulty]}
        </span>
      </div>

      <h3 className="question-stem">{question.stem}</h3>

      <div className="options">
        {question.options.map((opt, i) => {
          const isCorrect = i === question.correctIndex;
          const isSelected = i === selected;
          let cls = 'option';
          if (revealed) {
            if (isCorrect) cls += ' option-correct';
            else if (isSelected) cls += ' option-wrong';
          } else if (isSelected) {
            cls += ' option-selected';
          }
          return (
            <button
              key={i}
              className={cls}
              onClick={() => onSelect?.(i)}
              disabled={revealed || !onSelect}
              aria-pressed={isSelected}
            >
              <span className="option-label">{OPTION_LABELS[i]}</span>
              <span className="option-text">{opt.text}</span>
              {revealed && isCorrect && <span className="option-mark">✓</span>}
              {revealed && isSelected && !isCorrect && <span className="option-mark">✕</span>}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className="explanations">
          {question.options.map((opt, i) => (
            <p
              key={i}
              className={`explanation ${i === question.correctIndex ? 'is-correct' : ''}`}
            >
              <strong>{OPTION_LABELS[i]})</strong> {opt.explanation}
            </p>
          ))}
          <p className="study-hint">📚 پیشنهاد مطالعه: {question.studyHint}</p>
        </div>
      )}
    </div>
  );
}
