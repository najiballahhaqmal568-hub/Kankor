# 📓 دفترچه پروژه — اپ آمادگی کانکور افغانستان

> این فایل «حافظه زنده» پروژه است: وضعیت فعلی، آنچه ساخته شده، و نکات مهم برای ادامه کار.
> در پایان هر مرحله به‌روز می‌شود.

## معرفی

اپ آمادگی امتحان کانکور افغانستان — **PWA کاملاً آفلاین** به زبان دری (RTL) با دارک‌مود و پالت لاجورد/زعفرانی.

**قابلیت‌های فاز ۱ (MVP):**
1. بانک سؤالات با فیلتر مضمون/مبحث/سختی + حالت تمرین
2. شبیه‌ساز آزمون با تایمر (کامل ۱۶۰ سؤالی / مضمونی / سفارشی)
3. کارنامه هوشمند: تحلیل مضمون‌به‌مضمون، توضیح هر گزینه، پیشنهاد مطالعه
4. مرور فاصله‌دار با الگوریتم SM-2

## وضعیت فعلی

**وضعیت:** 🎉 **فاز ۱ (MVP آفلاین) کامل شد.** همه هفت مرحله پیاده و end-to-end تست شدند.

| مرحله | وضعیت |
|---|---|
| ۱. بنیاد (scaffold، تم، RTL، پوسته) | ✅ تکمیل |
| ۲. مدل داده + بانک سؤالات + Dexie | ✅ تکمیل |
| ۳. صفحه بانک سؤالات | ✅ تکمیل |
| ۴. شبیه‌ساز آزمون | ✅ تکمیل |
| ۵. کارنامه هوشمند | ✅ تکمیل |
| ۶. مرور فاصله‌دار SM-2 | ✅ تکمیل |
| ۷. PWA + صیقل نهایی | ✅ تکمیل |

**تست‌ها:** ۱۹ تست واحد سبز (examEngine ۷ + analytics ۵ + sm2 ۷). آفلاین با Service Worker تأیید شد. نمودار کارنامه از رنگ وضعیتی + برچسب عددی استفاده می‌کند (رنگ به‌تنهایی حامل معنا نیست).

**قدم بعدی (فاز ۲):** بسته‌بندی APK با Capacitor، افزودن سؤالات واقعی سال‌های گذشته، زبان پشتو در رابط.

## انتشار (Deployment)

- **آدرس زنده:** https://najiballahhaqmal568-hub.github.io/Kankor/
- انتشار خودکار با `.github/workflows/deploy-pages.yml` در هر push به برنچ توسعه.
- GitHub Pages با Source = «GitHub Actions» فعال شده است (اقدام یک‌بارهٔ مالک مخزن، ۱۴۰۵/۰۴/۲۰).
- بیلد با `--base` خودکار از `configure-pages` انجام می‌شود تا مسیر دارایی‌ها و Service Worker درست باشد.
- `vite.artifact.config.ts` یک بیلد تک‌فایله (`dist-artifact/`) برای پیش‌نمایش‌های موقت می‌سازد؛ در مخزن commit نمی‌شود.

## نقشه کد (تا این لحظه)

```
src/
├── main.tsx            # نقطه ورود؛ HashRouter + اعمال تم ذخیره‌شده
├── App.tsx             # پوسته: هدر (تغییر تم) + ناوبری پایین + مسیرها
├── lib/
│   ├── format.ts       # ارقام دری (faNum)، درصد، مدت‌زمان، تاریخ شمسی
│   └── theme.ts        # ذخیره/اعمال تم در localStorage و data-theme
├── styles/
│   ├── tokens.css      # توکن‌های رنگ لاجورد/زعفرانی (دارک پیش‌فرض + روشن)
│   ├── fonts.css       # Vazirmatn لوکال (از پکیج npm باندل می‌شود)
│   ├── base.css        # ریست + تایپوگرافی + فرم‌ها
│   └── components.css  # پوسته، ناوبری، card/btn/chip و اجزای عمومی
├── data/
│   ├── schema.ts       # تایپ‌های Question, Subject, ExamBlueprint, Attempt, SrsCard, ActiveExam
│   ├── subjects.ts     # ۱۰ مضمون + blueprint آزمون کامل و مضمونی
│   └── bank/           # ۱۰ فایل JSON سؤالات + index.ts (تجمیع + اعتبارسنجی + BANK_VERSION)
├── logic/
│   ├── examEngine.ts   # buildExam + gradeExam (خالص) + تست
│   ├── analytics.ts    # topicBreakdown/weakestTopics/studyRecommendations + تست
│   └── sm2.ts          # الگوریتم SuperMemo-2 (خالص) + تست
├── db/
│   ├── db.ts           # Dexie: questions/attempts/answers/srsCards/activeExam/meta
│   ├── seed.ts         # seed نسخه‌دار بانک به IndexedDB (اولین اجرا)
│   ├── questions.ts    # getQuestion/getQuestions از بانک استاتیک (نگاشت id)
│   ├── examSession.ts  # startExam/getActiveExam/saveActiveExam/finishExam
│   └── reviewQueue.ts  # enqueueForReview + dueCards + gradeCard (SM-2)
├── lib/
│   ├── format.ts       # ارقام دری، مدت، تاریخ شمسی
│   ├── theme.ts        # تم دارک/روشن
│   └── settings.ts     # اندازه فونت
├── components/
│   └── QuestionView.tsx # نمایش مشترک سؤال + گزینه‌ها + توضیح‌ها (تمرین/کارنامه/مرور)
└── pages/              # Home, Bank, ExamSetup, ExamRunner, Report, Review, Settings

پیکربندی PWA در `vite.config.ts` (vite-plugin-pwa) + آیکون‌ها در `public/icons/`.
```

### مدل داده — نکات
- **سؤال:** دقیقاً ۴ گزینه؛ هر گزینه `explanation` دارد (پایه کارنامه هوشمند). `studyHint` اجباری.
- **بانک:** برای افزودن سؤال جدید فقط فایل JSON مربوط را ویرایش و `BANK_VERSION` را در `bank/index.ts` یک واحد بالا ببر تا seed دوباره اجرا شود.
- **آزمون کامل:** ۱۶۰ سؤال / ۱۸۰ دقیقه؛ وزن‌ها در `subjects.ts` (ریاضی ۳۰، فزیک/کیمیا/بیولوژی هرکدام ۲۵، ...).
- **تایمر:** `ActiveExam.deadline` یک timestamp است تا با رفرش دقیق بماند.

## نکات مهم برای ادامه کار

- **RTL:** کل سند `dir="rtl"` است؛ در CSS از خواص logical (`inset-inline`, `padding-inline`) استفاده کن.
- **ارقام:** همیشه اعداد نمایشی را از `faNum()`/`faPercent()`/`faDuration()` عبور بده.
- **تم:** توکن‌ها در `tokens.css`؛ هرگز رنگ خام در کامپوننت‌ها ننویس.
- **فونت:** Vazirmatn از `node_modules` با مسیر نسبی در `fonts.css` باندل می‌شود — نیازی به CDN نیست (شرط آفلاین).
- **مسیرها:** HashRouter تا روی هر هاست استاتیکی بدون تنظیم سرور کار کند؛ `base: './'` در vite.config.
- آزمون کامل کانکور: **۱۶۰ سؤال / ۱۸۰ دقیقه** — وزن مضامین در مرحله ۲ در `subjects.ts` تعریف می‌شود.

## دستورات

```bash
npm run dev       # سرور توسعه
npm run build     # tsc --noEmit + vite build
npm run test      # vitest run
npm run preview   # پیش‌نمایش بیلد
```
