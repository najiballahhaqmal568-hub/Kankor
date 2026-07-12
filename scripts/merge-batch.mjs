#!/usr/bin/env node
/**
 * ادغام یک بچ سؤال جدید (هر شکل خام شناخته‌شده) در src/data/bank/questions.json.
 *
 * این اسکریپت خارج از اپ اجرا می‌شود (Node ساده) — کد اپ هرگز لازم نیست تغییر کند؛
 * فقط این اسکریپت باید بچ خام را به شکل canonical (منطبق بر Question در schema.ts)
 * تبدیل کند. اگر بچ بعدی شکل سومی داشت، فقط یک تابع normalize دیگر اینجا اضافه شود.
 *
 * استفاده:
 *   node scripts/merge-batch.mjs <path-to-batch.json>
 *
 * شکل‌های خام شناخته‌شده:
 *   A) { schema_version, source_form, field_notes, questions: [...] }
 *      questions[i].options = [{ text, correct, why_correct?, why_wrong? }]
 *      + explanation, chapter_ref, language, source, verified
 *
 *   B) [ { id, subject, topic, chapter, difficulty, question,
 *          options: string[], correct_index, why, why_wrong: string[],
 *          source_form, verified } ]
 *
 * نگاشت‌های نُرمال‌سازی (برای یکدست ماندن فیلترها در UI):
 *   سختی: «سخت» → «دشوار» (بانک موجود از «دشوار» استفاده می‌کند)
 *   مضمون: «ریاضی» → «ریاضیات» (بانک موجود از «ریاضیات» استفاده می‌کند)
 * اگر بچ بعدی مضمون/سختی جدیدی با نام متفاوت اما هم‌معنی آورد، این نگاشت‌ها
 * را در DIFFICULTY_ALIASES / SUBJECT_ALIASES پایین همین فایل اضافه کن.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BANK_PATH = path.join(__dirname, '../src/data/bank/questions.json');

const DIFFICULTY_ALIASES = { سخت: 'دشوار' };
const SUBJECT_ALIASES = { ریاضی: 'ریاضیات' };

function normalizeCanonical(q) {
  return {
    ...q,
    subject: SUBJECT_ALIASES[q.subject] ?? q.subject,
    difficulty: DIFFICULTY_ALIASES[q.difficulty] ?? q.difficulty,
  };
}

/** شکل B → canonical */
function normalizeFlatShape(q) {
  const options = q.options.map((text, i) => {
    const correct = i === q.correct_index;
    return {
      text,
      correct,
      ...(correct ? { why_correct: q.why } : { why_wrong: q.why_wrong[i] }),
    };
  });
  return normalizeCanonical({
    id: q.id,
    subject: q.subject,
    topic: q.chapter || q.topic,
    difficulty: q.difficulty,
    question: q.question,
    options,
    explanation: q.why,
    chapter_ref: q.chapter || q.topic,
    language: q.language || 'dari',
    source: q.source_form || q.source || '',
    verified: q.verified === true,
  });
}

function isCanonicalShape(q) {
  return Array.isArray(q.options) && typeof q.options[0] === 'object' && 'correct' in (q.options[0] ?? {});
}

function loadBatch(filePath) {
  const raw = JSON.parse(readFileSync(filePath, 'utf8'));
  const items = Array.isArray(raw) ? raw : raw.questions;
  if (!Array.isArray(items)) throw new Error('ساختار فایل ورودی شناخته‌شده نیست (نه آرایه، نه {questions:[]})');
  return items.map((q) => (isCanonicalShape(q) ? normalizeCanonical(q) : normalizeFlatShape(q)));
}

function validate(q) {
  const errors = [];
  if (!q.id) errors.push('id ندارد');
  if (!q.subject) errors.push('subject ندارد');
  if (!q.question) errors.push('question ندارد');
  if (!Array.isArray(q.options) || q.options.length < 2) errors.push('حداقل ۲ گزینه لازم است');
  const correctCount = (q.options || []).filter((o) => o.correct).length;
  if (correctCount !== 1) errors.push(`باید دقیقاً یک گزینه correct=true باشد (یافت‌شده: ${correctCount})`);
  if (!q.explanation) errors.push('explanation ندارد');
  if (!q.chapter_ref) errors.push('chapter_ref ندارد');
  return errors;
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('استفاده: node scripts/merge-batch.mjs <path-to-batch.json>');
    process.exit(1);
  }

  const bank = JSON.parse(readFileSync(BANK_PATH, 'utf8'));
  const existingIds = new Set(bank.questions.map((q) => q.id));
  const incoming = loadBatch(inputPath);

  let added = 0;
  let skipped = 0;
  const problems = [];

  for (const q of incoming) {
    const errors = validate(q);
    if (errors.length) {
      problems.push(`${q.id ?? '(بدون id)'}: ${errors.join('؛ ')}`);
      continue;
    }
    if (existingIds.has(q.id)) {
      skipped++;
      continue;
    }
    bank.questions.push(q);
    existingIds.add(q.id);
    added++;
  }

  if (problems.length) {
    console.error('❌ سؤالات نامعتبر (اضافه نشدند):');
    problems.forEach((p) => console.error('  - ' + p));
  }

  if (added > 0) {
    writeFileSync(BANK_PATH, JSON.stringify(bank, null, 2) + '\n', 'utf8');
  }

  console.log(`✅ افزوده شد: ${added} | رد شد (تکراری): ${skipped} | نامعتبر: ${problems.length}`);
  console.log(`مجموع سؤالات بانک اکنون: ${bank.questions.length}`);
  if (added > 0) {
    console.log('⚠️  یادت نرود BANK_VERSION را در src/data/bank/index.ts یک واحد بالا ببری.');
  }
}

main();
