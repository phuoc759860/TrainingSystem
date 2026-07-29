import { Book } from "lucide-react";

function AuthCard({ title, subtitle, children, altText, altAction, altLink, toast, setToast }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-brand-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br from-brand-600 to-brand-500 shadow-lg shadow-brand-500/25 mb-4">
            <Book size={28} color="white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
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
