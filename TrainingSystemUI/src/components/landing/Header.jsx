import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Logo from "./Logo";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-2 z-30 w-full md:top-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div
          className={`relative flex h-14 items-center justify-between gap-3 rounded-2xl bg-white/90 px-3 backdrop-blur-xs transition-shadow duration-300 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(var(--color-gray-100),var(--color-gray-200))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] ${
            scrolled ? "shadow-lg shadow-black/[0.06]" : "shadow-lg shadow-black/[0.03]"
          }`}
        >
          <div className="flex flex-1 items-center"><Logo /></div>
          <ul className="flex flex-1 items-center justify-end gap-3">
            <li>
              <Link to="/login" className="landing-btn-sm border border-brand-200 bg-white text-brand-700 shadow-sm hover:bg-brand-50 hover:border-brand-300 transition-all">
                Login
              </Link>
            </li>
            <li>
              <Link to="/register" className="landing-btn-sm bg-linear-to-t from-brand-600 to-brand-500 text-white shadow-sm shadow-brand-500/20 hover:shadow-brand-500/40 hover:from-brand-700 hover:to-brand-600 active:scale-[0.97] transition-all">
                Register
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}