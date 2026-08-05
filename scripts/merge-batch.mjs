#!/usr/bin/env node
/**
 * ادغام بچ‌های سؤال جدید در src/data/bank/questions.json — با اعتبارسنجی سخت‌گیرانه.
 *
 * استفاده:
 *   node scripts/merge-batch.mjs                    ← همه فایل‌های جدید content/questions را ادغام کن
 *   node scripts/merge-batch.mjs <path-to-batch>    ← فقط همین فایل را ادغام کن
 *
 * جریان کاری پیشنهادی: فایل خام بچ را در content/questions/ بگذار و اسکریپت را
 * بدون آرگومان اجرا کن. فایل‌های قبلاً پردازش‌شده (بر اساس هش محتوا در
 * content/questions/.merged.json) خودکار رد می‌شوند؛ اگر محتوای فایلی تغییر کند
 * دوباره پردازش می‌شود (تکراری‌ها بر اساس id رد می‌شوند، پس ادغام idempotent است).
 *
 * شکل‌های خام شناخته‌شده:
 *   A) { schema_version, questions: [...] } — options آبجکتی { text, correct, why_correct?, why_wrong? }
 *   B) [ ... ] — options رشته‌ای + correct_index + why + why_wrong[]
 * اگر بچی با شکل سوم رسید، فقط یک تابع normalize دیگر به همین فایل اضافه شود؛ کد اپ ثابت می‌ماند.
 *
 * اعتبارسنجی (خط دفاع دوم کیفیت — هر سؤالی که رد شود گزارش می‌شود و وارد بانک نمی‌شود):
 *   - جواب درست مشخص: شکل B باید correct_index عددیِ غیر null و در محدوده گزینه‌ها داشته باشد؛
 *     شکل A باید دقیقاً یک گزینه correct=true داشته باشد
 *   - دقیقاً ۴ گزینه
 *   - verified === true (سؤال تأییدنشده اصلاً وارد بانک نمی‌شود)
 *   - فیلدهای id / subject / topic / question / explanation / chapter_ref خالی نباشند
 *   - هر گزینه غلط why_wrong و گزینه درست why_correct داشته باشد
 *   - در شکل B طول why_wrong با تعداد گزینه‌ها برابر باشد (وگرنه توضیح‌ها یک خانه جابه‌جا می‌چسبند)
 *
 * topic در برابر chapter_ref: topic دستهٔ درشت است (کارنامه و فیلتر بانک با آن گروه می‌شوند)
 * و chapter_ref زیرمبحث ریز برای «پیشنهاد مطالعه». این دو هرگز نباید یکی شوند.
 *
 * نگاشت نام‌های هم‌معنی (برای یکدست ماندن فیلترهای UI):
 *   سختی: «سخت» → «دشوار» · مضمون: «ریاضی» → «ریاضیات»
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BANK_PATH = path.join(__dirname, '../src/data/bank/questions.json');
const BANK_INDEX_PATH = path.join(__dirname, '../src/data/bank/index.ts');
const CONTENT_DIR = path.join(__dirname, '../content/questions');
const MANIFEST_PATH = path.join(CONTENT_DIR, '.merged.json');

/**
 * BANK_VERSION را یک واحد بالا می‌برد تا seed دوباره در IndexedDB اجرا شود.
 * خودکار است چون شرط «بچ‌های بعدی بدون تغییر کد اضافه شوند» با ویرایش دستی نقض می‌شد.
 */
function bumpBankVersion() {
  const src = readFileSync(BANK_INDEX_PATH, 'utf8');
  const pattern = /(export const BANK_VERSION = )(\d+)/;
  const match = src.match(pattern);
  if (!match) throw new Error(`BANK_VERSION در ${BANK_INDEX_PATH} پیدا نشد`);
  const next = Number(match[2]) + 1;
  writeFileSync(BANK_INDEX_PATH, src.replace(pattern, `$1${next}`), 'utf8');
  return next;
}

const DIFFICULTY_ALIASES = { سخت: 'دشوار' };
const SUBJECT_ALIASES = { ریاضی: 'ریاضیات' };

const REQUIRED_OPTION_COUNT = 4;

function normalizeCanonical(q) {
  return {
    ...q,
    subject: SUBJECT_ALIASES[q.subject] ?? q.subject,
    difficulty: DIFFICULTY_ALIASES[q.difficulty] ?? q.difficulty,
  };
}

/** شکل B (flat/correct_index) → canonical. خطاهای ساختاری خام همین‌جا جمع می‌شوند. */
function normalizeFlatShape(q, rawErrors) {
  const ci = q.correct_index;
  if (ci === null || ci === undefined || !Number.isInteger(ci)) {
    rawErrors.push('correct_index غیر عددی یا null است');
  } else if (!Array.isArray(q.options) || ci < 0 || ci >= q.options.length) {
    rawErrors.push(`correct_index (${ci}) خارج از محدوده گزینه‌هاست`);
  }
  const options = (q.options ?? []).map((text, i) => {
    const correct = i === ci;
    return {
      text,
      correct,
      ...(correct ? { why_correct: q.why } : { why_wrong: (q.why_wrong ?? [])[i] }),
    };
  });
  if (Array.isArray(q.why_wrong) && Array.isArray(q.options) && q.why_wrong.length !== q.options.length) {
    rawErrors.push(
      `طول why_wrong (${q.why_wrong.length}) با تعداد گزینه‌ها (${q.options.length}) برابر نیست — ` +
        'توضیح‌ها به گزینه اشتباه می‌چسبند',
    );
  }
  return normalizeCanonical({
    id: q.id,
    subject: q.subject,
    // topic = دستهٔ درشت (مثل «مشتق») · chapter = زیرمبحث ریز (مثل «مشتق چندجمله‌ای درجه دوم»).
    // این دو نباید یکی شوند وگرنه گروه‌بندی کارنامه و فیلتر بانک به ازای هر سؤال یک چیپ می‌سازند.
    topic: q.topic || q.chapter,
    difficulty: q.difficulty,
    question: q.question,
    options,
    explanation: q.why,
    chapter_ref: q.chapter || q.chapter_ref || q.topic,
    language: q.language || 'dari',
    source: q.source_form || q.source || '',
    verified: q.verified === true,
  });
}

function isCanonicalShape(q) {
  return Array.isArray(q.options) && typeof q.options[0] === 'object' && q.options[0] !== null && 'correct' in q.options[0];
}

/** اعتبارسنجی سخت‌گیرانه روی شکل canonical — آرایه دلایل رد را برمی‌گرداند */
function validate(q) {
  const errors = [];
  if (!q.id) errors.push('id ندارد');
  if (!q.subject) errors.push('subject ندارد');
  if (!q.topic) errors.push('topic ندارد (گروه‌بندی کارنامه و فیلتر بانک به آن وابسته است)');
  if (!q.question) errors.push('question ندارد');
  if (!Array.isArray(q.options) || q.options.length !== REQUIRED_OPTION_COUNT) {
    errors.push(`باید دقیقاً ${REQUIRED_OPTION_COUNT} گزینه داشته باشد (دارد: ${q.options?.length ?? 0})`);
  }
  const correctCount = (q.options ?? []).filter((o) => o.correct).length;
  if (correctCount !== 1) errors.push(`باید دقیقاً یک گزینه درست داشته باشد (دارد: ${correctCount})`);
  if (!q.explanation) errors.push('explanation ندارد');
  if (!q.chapter_ref) errors.push('chapter_ref ندارد');
  if (q.verified !== true) errors.push('verified برابر true نیست');
  for (const [i, o] of (q.options ?? []).entries()) {
    if (!o.text) errors.push(`گزینه ${i + 1} متن ندارد`);
    if (o.correct && !o.why_correct) errors.push(`گزینه درست (${i + 1}) توضیح why_correct ندارد`);
    if (!o.correct && !o.why_wrong) errors.push(`گزینه غلط (${i + 1}) توضیح why_wrong ندارد`);
  }
  return errors;
}

function loadBatchItems(filePath) {
  const raw = JSON.parse(readFileSync(filePath, 'utf8'));
  const items = Array.isArray(raw) ? raw : raw.questions;
  if (!Array.isArray(items)) throw new Error('ساختار فایل شناخته‌شده نیست (نه آرایه، نه {questions:[]})');
  return items;
}

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function loadManifest() {
  return existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) : {};
}

/** یک فایل بچ را پردازش می‌کند و آمار برمی‌گرداند؛ سؤالات معتبر را به bank اضافه می‌کند */
function processFile(filePath, bank, existingIds) {
  const stats = { added: 0, duplicates: 0, rejected: [] };
  for (const rawItem of loadBatchItems(filePath)) {
    const rawErrors = [];
    const q = isCanonicalShape(rawItem)
      ? normalizeCanonical(rawItem)
      : normalizeFlatShape(rawItem, rawErrors);
    const errors = [...rawErrors, ...validate(q)];
    if (errors.length) {
      stats.rejected.push({ id: q.id ?? '(بدون id)', reasons: errors });
      continue;
    }
    if (existingIds.has(q.id)) {
      stats.duplicates++;
      continue;
    }
    bank.questions.push(q);
    existingIds.add(q.id);
    stats.added++;
  }
  return stats;
}

function main() {
  const explicitPath = process.argv[2];
  const bank = JSON.parse(readFileSync(BANK_PATH, 'utf8'));
  const existingIds = new Set(bank.questions.map((q) => q.id));
  const manifest = loadManifest();

  let targets;
  if (explicitPath) {
    targets = [explicitPath];
  } else {
    if (!existsSync(CONTENT_DIR)) {
      console.error(`پوشه ${CONTENT_DIR} وجود ندارد.`);
      process.exit(1);
    }
    targets = readdirSync(CONTENT_DIR)
      .filter((f) => f.endsWith('.json') && !f.startsWith('.'))
      .sort()
      .map((f) => path.join(CONTENT_DIR, f))
      .filter((p) => manifest[path.basename(p)]?.hash !== sha256(p));
    if (targets.length === 0) {
      console.log('✅ فایل جدید یا تغییرکرده‌ای در content/questions نیست — بانک به‌روز است.');
      return;
    }
  }

  let totalAdded = 0;
  let totalRejected = 0;

  for (const filePath of targets) {
    const name = path.basename(filePath);
    console.log(`\n📄 ${name}`);
    const stats = processFile(filePath, bank, existingIds);
    totalAdded += stats.added;
    totalRejected += stats.rejected.length;
    console.log(`   افزوده: ${stats.added} · تکراری (قبلاً در بانک): ${stats.duplicates} · ردشده: ${stats.rejected.length}`);
    for (const r of stats.rejected) {
      console.log(`   ❌ ${r.id}:`);
      for (const reason of r.reasons) console.log(`      - ${reason}`);
    }
    // فایل‌های داخل content/questions در manifest ثبت می‌شوند (حتی اگر همه تکراری بودند)
    if (!explicitPath || filePath.startsWith(CONTENT_DIR)) {
      manifest[name] = {
        hash: sha256(filePath),
        mergedAt: new Date().toISOString(),
        added: stats.added,
        duplicates: stats.duplicates,
        rejected: stats.rejected.map((r) => r.id),
      };
    }
  }

  if (totalAdded > 0) {
    writeFileSync(BANK_PATH, JSON.stringify(bank, null, 2) + '\n', 'utf8');
  }
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log('\n──────── جمع‌بندی ────────');
  console.log(`افزوده‌شده: ${totalAdded} · ردشده: ${totalRejected}`);
  console.log(`مجموع سؤالات بانک اکنون: ${bank.questions.length}`);
  if (totalAdded > 0) {
    console.log(`🔖 BANK_VERSION خودکار به ${bumpBankVersion()} ارتقا یافت (seed دوباره اجرا می‌شود).`);
  }
}

main();
