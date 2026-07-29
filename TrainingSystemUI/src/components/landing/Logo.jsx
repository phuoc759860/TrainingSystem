import { Link } from "react-router-dom";
import { Book } from "lucide-react";

export default function Logo() {
  return (
    <Link to="/" className="inline-flex items-center gap-2" aria-label="TrainingHub">
      <Book size={28} className="text-brand-600" />
      <span className="text-lg font-bold text-gray-900">TrainingHub</span>
    </Link>
  );
}
