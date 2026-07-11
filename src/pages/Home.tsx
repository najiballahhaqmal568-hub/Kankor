import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="stack">
      <section className="card">
        <h1 className="page-title">به اپ آمادگی کانکور خوش آمدید 🎓</h1>
        <p className="muted">
          بانک سؤالات، شبیه‌ساز آزمون با تایمر، کارنامه هوشمند و مرور فاصله‌دار — همه به‌صورت کاملاً آفلاین.
        </p>
        <div className="row">
          <Link to="/exam" className="btn btn-primary btn-lg">شروع آزمون آزمایشی</Link>
          <Link to="/bank" className="btn btn-lg">تمرین سؤالات</Link>
        </div>
      </section>
    </div>
  );
}
