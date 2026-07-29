export default function LargeTestimonial() {
  return (
    <section>
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          <div className="space-y-4 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M4 12l5 5L20 6" />
              </svg>
              Verified trainer
            </span>
            <p className="text-2xl font-bold text-gray-900">
              &ldquo;TrainingHub has transformed how I deliver courses. From
              managing materials to{" "}
              <em className="italic text-gray-500">tracking student progress</em>,
              it's become my go-to platform for everything.&rdquo;
            </p>
            <div className="text-sm font-medium text-gray-500">
              <span className="text-gray-700">John Carter</span>{" "}
              <span className="text-gray-400">/</span>{" "}
              <a className="text-brand-500" href="#0">Senior Trainer at TechCorp</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}