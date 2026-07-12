import type { Question } from '../data/schema';
import { getCorrectIndex } from '../data/schema';
import { getSubject } from '../data/subjects';
import { faNum } from '../lib/format';

const OPTION_LABELS = ['الف', 'ب', 'ج', 'د', 'ه', 'و'];

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
  const subject = getSubject(question.subject);
  const correctIndex = getCorrectIndex(question);
  const wasWrong = revealed && selected != null && selected !== correctIndex;

  return (
    <div className="question-view">
      <div className="row spread small muted">
        <span>
          {subject.icon} {subject.name} · {question.topic}
        </span>
        <span>
          {index != null && total != null && `سؤال ${faNum(index + 1)} از ${faNum(total)} · `}
          سختی: {question.difficulty}
        </span>
      </div>

      <h3 className="question-stem">{question.question}</h3>

      <div className="options">
        {question.options.map((opt, i) => {
          const isCorrect = i === correctIndex;
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
              <span className="option-label">{OPTION_LABELS[i] ?? faNum(i + 1)}</span>
              <span className="option-text">{opt.text}</span>
              {revealed && isCorrect && <span className="option-mark">✓</span>}
              {revealed && isSelected && !isCorrect && <span className="option-mark">✕</span>}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className="explanations">
          {/* چرا پاسخ درست، درست است — همیشه نمایش داده می‌شود */}
          <p className="explanation-callout">💡 {question.explanation}</p>

          {wasWrong && (
            <p className="explanation is-wrong-selected">
              <strong>چرا گزینه انتخابی شما غلط بود:</strong>{' '}
              {question.options[selected!].why_wrong}
            </p>
          )}

          {question.options.map((opt, i) => (
            <p
              key={i}
              className={`explanation ${i === correctIndex ? 'is-correct' : ''}`}
            >
              <strong>{(OPTION_LABELS[i] ?? faNum(i + 1))})</strong>{' '}
              {i === correctIndex ? opt.why_correct : opt.why_wrong}
            </p>
          ))}

          <p className="study-hint">📚 پیشنهاد مطالعه: {question.chapter_ref}</p>
        </div>
      )}
    </div>
  );
}
