const points = [
  {
    id: "gemini-omni-flash-practical-ai-video-workflow",
    title: "An AI video generator for creators",
    description:
      "Gemini Omni Flash helps creators turn prompts, images, and creative direction into online AI video clips for marketing, social media, products, and visual concepts.",
  },
  {
    id: "gemini-omni-flash-text-image-and-video-to-video",
    title: "Built for text and image inputs",
    description:
      "Start from a text prompt when you need a new scene, or upload an image when visual direction matters. Add camera, motion, style, and pacing to guide the result.",
  },
  {
    id: "gemini-omni-flash-video-to-video-workflows",
    title: "Focused on usable video output",
    description:
      "A good AI video tool should help you generate, review, and refine clips quickly so you can test ideas before spending time on full production.",
  },
  {
    id: "gemini-omni-flash-for-marketing-and-creative-teams",
    title: "Designed for marketing and creative teams",
    description:
      "Use Gemini Omni Flash for ad creatives, product demo videos, landing page visuals, short social clips, and repeatable campaign experiments.",
  },
];

export default function WhatIsGeminiOmniFlashSection({ locale }: { locale: string }) {
  if (locale !== "en") {
    return null;
  }

  return (
    <section className="py-20 sm:py-24 bg-background border-t border-border/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
            What Is Gemini Omni Flash
          </h2>
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-white/45 leading-relaxed">
            Gemini Omni Flash is an AI video generator for turning text prompts and images into videos for ads, product demos, social media, and creative projects.
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
                Gemini Omni Flash
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
