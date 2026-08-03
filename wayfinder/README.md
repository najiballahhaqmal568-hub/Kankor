# راهنمای این نقشه (tracker محلی)

اسکیل `wayfinder` معمولاً روی issue tracker کار می‌کند. در این محیط tracker نصب نبود،
پس طبق خودِ SKILL.md به **حالت پیش‌فرض markdown محلی** برگشتیم:

| مفهوم wayfinder | اینجا |
|---|---|
| نقشه (`wayfinder:map`) | `wayfinder/MAP.md` |
| تکت (child issue) | یک فایل در `wayfinder/tickets/` |
| id تکت | فیلد `id` در front-matter + پیشوند نام فایل |
| باز/بسته | `status: open` یا `status: closed` |
| claim | `assignee: <نام>` — قبل از شروع کار پر شود |
| blocking بومی | `blocked_by: [...]` و `blocks: [...]` |
| **frontier** | تکت‌های `status: open` که `blocked_by` آن‌ها همه بسته‌اند و `assignee` ندارند |
| resolution comment | بخش `## Resolution` که هنگام بستن به انتهای فایل اضافه می‌شود |

## قواعدی که نباید شکسته شوند

- **هر جلسه فقط یک تکت** (به‌جز تکت‌های `research`).
- تکت `HITL` فقط با گفت‌وگوی زنده با انسان حل می‌شود — ایجنت هرگز جای انسان جواب نمی‌دهد.
- بعد از حل هر تکت: بستن فایل + افزودن یک خط به `## Decisions so far` در MAP.md +
  گرافیدن مه‌ای که حالا سخت شده به تکت تازه.
- این نقشه **تصمیم** تولید می‌کند نه کد. رسیدن به «حالا فقط باید ساخت» یعنی نقشه تمام است.

## دیدن frontier

```bash
grep -L "status: closed" wayfinder/tickets/*.md | xargs grep -l "blocked_by: \[\]"
```
