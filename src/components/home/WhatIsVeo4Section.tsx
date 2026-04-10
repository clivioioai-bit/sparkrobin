"use client";

import { useLocale } from "next-intl";

const points = [
  {
    id: "veo4-practical-ai-video-workflow",
    title: "A practical AI video workflow",
    description:
      "VEO 4 is presented here as a fast way to move from prompt or image to usable video output. Instead of treating AI video as a research demo, this site focuses on turning ideas into clips that can actually be used in ads, landing pages, and social campaigns.",
  },
  {
    id: "veo4-text-image-and-video-to-video",
    title: "Built for text, image, and video to video",
    description:
      "The core creation paths are simple: start from text when you want to explore a concept, start from an image when you need visual direction, or start from video when you want to restyle, extend, or improve an existing clip without rebuilding it from scratch.",
  },
  {
    id: "veo4-video-to-video-workflows",
    title: "Useful for video to video workflows",
    description:
      "Video to video matters when a team already has footage, rough cuts, or source material that needs a new look, stronger pacing, or cleaner motion. This gives VEO 4 a practical role in iteration, not just first-pass generation.",
  },
  {
    id: "veo4-for-marketing-and-creative-teams",
    title: "Designed for marketing and creative teams",
    description:
      "VEO 4 is most useful when speed, clarity, and iteration matter. Marketers, creators, agencies, and product teams can use it to produce first drafts faster, compare variations, and shorten the gap between concept and publishable media.",
  },
];

export default function WhatIsVeo4Section() {
  const locale = useLocale();

  if (locale !== "en") {
    return null;
  }

  return (
    <section className="py-20 sm:py-24 bg-background border-t border-border/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
            What Is VEO 4
          </h2>
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-white/45 leading-relaxed">
            VEO 4 is an AI video creation workflow for teams that want to turn text prompts, images, or existing video into clearer, more usable output without a slow production process.
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
                VEO 4
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
