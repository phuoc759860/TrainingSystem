import { Book } from "lucide-react";

function AuthCard({ title, subtitle, children, altText, altAction, altLink }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 40%, #dbeafe 100%)" }}>
      {/* Decorative background elements */}
      <div className="absolute top-[-120px] right-[-80px] w-[300px] h-[300px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)" }} />
      <div className="absolute bottom-[-100px] left-[-60px] w-[250px] h-[250px] rounded-full opacity-15" style={{ background: "radial-gradient(circle, #2563eb 0%, transparent 70%)" }} />
      <div className="absolute top-[40%] left-[60%] w-[200px] h-[200px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }} />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-5 relative" style={{ background: "linear-gradient(135deg, #2563eb, #3b82f6)", boxShadow: "0 8px 32px rgba(37,99,235,.35), inset 0 1px 0 rgba(255,255,255,.2)" }}>
            <Book size={30} color="white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>{title}</h1>
          <p className="text-gray-500 text-sm mt-1.5">{subtitle}</p>
        </div>

        <div className="rounded-2xl p-8 relative" style={{ background: "rgba(255,255,255,.85)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,.6)", boxShadow: "0 20px 60px -16px rgba(15,23,42,.15), 0 0 40px rgba(37,99,235,.06)" }}>
          {children}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          {altText}{" "}
          <button
            onClick={() => altLink()}
            className="font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            {altAction}
          </button>
        </p>
      </div>
    </div>
  );
}

export default AuthCard;
