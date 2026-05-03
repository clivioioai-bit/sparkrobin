const points = [
  {
    id: "spark-robin-practical-ai-video-workflow",
    title: "A release-watch layer for creators",
    description:
      "Spark Robin is still surrounded by speculation, so this site treats it as both a topic to watch and a workflow to prepare for. The goal is to keep confirmed facts, assumptions, and practical creation steps separate.",
  },
  {
    id: "spark-robin-text-image-and-video-to-video",
    title: "Built around reusable creative inputs",
    description:
      "Start from text when you need a scene brief, from an image when visual direction matters, or from existing footage when you want to test a new treatment. Each path is designed to preserve the creative notes behind the draft.",
  },
  {
    id: "spark-robin-video-to-video-workflows",
    title: "Focused on reviewable drafts",
    description:
      "A good AI video workflow is not just a render button. It should help teams compare versions, keep track of what changed, and decide whether a direction is worth more production time.",
  },
  {
    id: "spark-robin-for-marketing-and-creative-teams",
    title: "Designed for teams preparing ahead",
    description:
      "When official model details change, prepared teams move faster. Prompt libraries, reference assets, and shot notes can outlast a single tool or model name.",
  },
];

export default function WhatIsSparkRobinSection({ locale }: { locale: string }) {
  if (locale !== "en") {
    return null;
  }

  return (
    <section className="py-20 sm:py-24 bg-background border-t border-border/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
            What Is Spark Robin
          </h2>
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-white/45 leading-relaxed">
            Spark Robin is a release-watch and AI video workflow hub for teams that want reusable prompts, reference-led drafts, and clearer creative decisions before the next model wave arrives.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {points.map((point) => (
            <section
              key={point.title}
              aria-labelledby={point.id}
              className="rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6 sm:p-7 shadow-[0_10px_40px_rgba(0,0,0,0.22)]"
            >
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-4">
                Spark Robin
              </div>
              <h3 id={point.id} className="text-xl sm:text-2xl font-semibold text-white mb-3">
                {point.title}
              </h3>
              <p className="text-sm sm:text-base leading-7 text-white/65">{point.description}</p>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
