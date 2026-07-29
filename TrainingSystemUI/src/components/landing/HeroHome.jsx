import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PageIllustration from "./PageIllustration";

function MarkedPaperCard() {
  return (
    <div className="paper-card" aria-hidden="true">
      <div className="paper-card__holes"><span /><span /><span /></div>
      <p className="paper-card__title">Module 4 Quiz — React Basics</p>
      <ul className="paper-card__questions">
        <li>
          <span className="paper-card__q">1. useState returns…</span>
          <span className="paper-card__answer paper-card__answer--correct">
            a value and setter
            <svg className="paper-card__check" viewBox="0 0 24 24"><path d="M4 12l5 5L20 6" fill="none" /></svg>
          </span>
        </li>
        <li>
          <span className="paper-card__q">2. useEffect runs…</span>
          <span className="paper-card__answer paper-card__answer--correct">
            after render
            <svg className="paper-card__check paper-card__check--delay2" viewBox="0 0 24 24"><path d="M4 12l5 5L20 6" fill="none" /></svg>
          </span>
        </li>
        <li>
          <span className="paper-card__q">3. Keys help React…</span>
          <span className="paper-card__answer paper-card__answer--wrong">
            re-render faster
            <svg className="paper-card__cross" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" /></svg>
          </span>
        </li>
      </ul>
      <div className="paper-card__stamp">
        <span>92%</span>
        <small>auto-graded</small>
      </div>
    </div>
  );
}

export default function HeroHome() {
  return (
    <section className="relative">
      <PageIllustration />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 pt-32 pb-20 md:pb-28 md:pt-40 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <p className="mb-4 text-sm font-semibold tracking-wide text-brand-600 uppercase" data-aos="fade-up">
              Courses · Exams · Grading
            </p>
            <h1 className="hero-display mb-6 text-5xl text-gray-900 md:text-6xl" data-aos="fade-up" data-aos-delay={100}>
              Where courses, exams, and grades finally <em>agree</em>.
            </h1>
            <p className="mx-auto mb-8 max-w-lg text-lg text-gray-600 lg:mx-0" data-aos="fade-up" data-aos-delay={200}>
              Build courses, grade multiple-choice exams the second a student submits,
              and see exactly who needs help — with role-based access for admins,
              trainers, and students from day one.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row lg:justify-start" data-aos="fade-up" data-aos-delay={300}>
              <Link to="/login" className="landing-btn group w-full bg-linear-to-t from-brand-600 to-brand-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-sm hover:bg-[length:100%_150%] sm:w-auto">
                <span className="relative inline-flex items-center">
                  Get Started
                  <ArrowRight size={16} className="ml-1 text-brand-300 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
              <Link to="#features" className="landing-btn w-full bg-white text-gray-800 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 sm:w-auto">
                See what's included
              </Link>
            </div>
          </div>

          <div data-aos="fade-up" data-aos-delay={200}>
            <MarkedPaperCard />
          </div>
        </div>
      </div>
    </section>
  );
}