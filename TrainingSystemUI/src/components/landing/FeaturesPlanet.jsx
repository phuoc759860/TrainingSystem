import { BookOpen, ClipboardCheck, Users, FileText, BarChart3, Shield } from "lucide-react";

const iconClass = "text-brand-400";

const features = [
  {
    title: "Course Management",
    description:
      "Create, organize, and manage training courses with structured lessons and materials tailored to your curriculum.",
    icon: <BookOpen size={18} className={iconClass} />,
  },
  {
    title: "Exam System",
    description:
      "Build exams with multiple-choice and essay questions. MC questions are auto-graded, essays flagged for trainer review.",
    icon: <ClipboardCheck size={18} className={iconClass} />,
  },
  {
    title: "Student Enrollment",
    description:
      "Enroll students into courses, track enrollment status, and manage who has access to what content.",
    icon: <Users size={18} className={iconClass} />,
  },
  {
    title: "Learning Materials",
    description:
      "Upload and organize PDFs, presentations, and resources for each lesson to keep students engaged.",
    icon: <FileText size={18} className={iconClass} />,
  },
  {
    title: "Statistics & Analytics",
    description:
      "Track student performance, pass rates, question accuracy, and identify areas needing attention.",
    icon: <BarChart3 size={18} className={iconClass} />,
  },
  {
    title: "Role-Based Access",
    description:
      "Admin, Trainer, and Student roles with tailored permissions and personalized dashboards for each user type.",
    icon: <Shield size={18} className={iconClass} />,
  },
];

export default function FeaturesPlanet() {
  return (
    <section id="features" className="relative bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="py-16 md:py-24">
          <div className="mb-14 max-w-xl">
            <p className="mb-3 text-sm font-semibold tracking-wide text-brand-400 uppercase">
              The syllabus
            </p>
            <h2 className="text-3xl font-bold text-gray-100 md:text-4xl">
              Everything on the course roster
            </h2>
          </div>

          <ol className="divide-y divide-gray-800 border-y border-gray-800">
            {features.map((f, i) => (
              <li
                key={f.title}
                className="group grid grid-cols-[2.5rem_1fr] items-start gap-x-4 py-6 transition-colors hover:bg-gray-800/40 sm:grid-cols-[2.5rem_1fr_16rem]"
                data-aos="fade-up"
                data-aos-delay={i * 60}
              >
                <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15">
                  {f.icon}
                </span>
                <h3 className="font-medium text-gray-100 sm:col-span-1">
                  {f.title}
                </h3>
                <p className="text-[14px] leading-relaxed text-gray-400">
                  {f.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
