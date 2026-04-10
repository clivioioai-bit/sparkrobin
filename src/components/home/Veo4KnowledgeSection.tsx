"use client";

import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";

type ContentCard = {
  title: string;
  description: string;
};

type CompareRow = {
  model: string;
  bestFor: string;
  strengths: string;
  chooseWhen: string;
  recommendation?: string;
  href?: string;
  ctaLabel?: string;
};

const creationCards: ContentCard[] = [
  {
    title: "Product ads and marketing videos",
    description:
      "Use VEO 4 to turn product angles, offer hooks, and visual direction into polished first drafts for paid campaigns, landing pages, and launch assets."
  },
  {
    title: "Social media short-form content",
    description:
      "Build vertical videos, faster hooks, and more creative variations for TikTok, Reels, Shorts, and performance testing without rebuilding every asset from scratch."
  },
  {
    title: "Brand storytelling and creative campaigns",
    description:
      "Explore cinematic direction, stronger scene pacing, and more consistent visual language when your goal is atmosphere, narrative flow, and branded storytelling."
  },
  {
    title: "Concept videos and visual prototypes",
    description:
      "Bridge the gap between static mockups and finished edits by using VEO 4 for launch concepts, product demos, onboarding visuals, and motion-based prototypes."
  }
];

const advertisingCards: ContentCard[] = [
  {
    title: "Faster creative testing",
    description:
      "Validate multiple hooks, openings, and scene directions quickly so your team can test ideas before committing more budget or production time."
  },
  {
    title: "Lower production cost",
    description:
      "Reduce the amount of manual work needed to get a strong first draft, especially when campaigns require fresh assets every week."
  },
  {
    title: "More variations for campaigns",
    description:
      "Generate different pacing styles, framing choices, and visual angles while keeping a repeatable workflow that supports campaign iteration."
  },
  {
    title: "Better fit for performance marketing",
    description:
      "Use VEO 4 when you need videos designed around a job to be done, such as earning a click, improving message clarity, or increasing product understanding."
  }
];

const comparisonRows: CompareRow[] = [
  {
    model: "VEO 4",
    bestFor: "Teams that need the fastest path from idea to usable video output",
    strengths: "Balanced text-to-video and image-to-video workflows, simpler product UX, cleaner export paths, and stronger fit for campaign iteration",
    chooseWhen: "You want one workflow that gets your team from prompt or image to ad concepts, landing-page media, and social creative without extra setup.",
    recommendation: "Best overall starting point",
    href: "/veo4-text-to-video",
  },
  {
    model: "Veo 3",
    bestFor: "Higher-end realism and audio-led cinematic output",
    strengths: "Google highlights native audio, dialogue, lip sync, strong prompt adherence, and more realistic physics in Veo 3",
    chooseWhen: "You care more about premium realism and audio generated with the clip than about the simplest campaign workflow.",
    recommendation: "Choose for realism-first work",
  },
  {
    model: "Seedance 2.0",
    bestFor: "Reference-heavy creation and multimodal editing workflows",
    strengths: "ByteDance says Seedance 2.0 supports text, image, audio, and video inputs, along with editing, extension, and 15-second multi-shot audio-video output",
    chooseWhen: "You need to direct the model with multiple assets and want more control over references, edits, and continuation.",
    recommendation: "Choose for control-heavy workflows",
    href: "https://seedancev2.ai",
    ctaLabel: "Visit Seedance 2.0",
  },
  {
    model: "Kling",
    bestFor: "Shot-driven generation with strong consistency and multimodal references",
    strengths: "Kuaishou highlights multimodal input and output, stronger consistency, native audio, longer 15-second outputs, and more precise shot control in recent Kling releases",
    chooseWhen: "You want more director-style control, stronger reference usage, and longer multimodal clips than a lightweight social workflow usually provides.",
    recommendation: "Choose for shot control",
  },
  {
    model: "Sora 2",
    bestFor: "Short clips, remixing, and app-style iterative creation",
    strengths: "OpenAI describes Sora around short video generation, image starts, remixing, storyboards, and collaborative editing workflows",
    chooseWhen: "You want fast short-form exploration, remix-based iteration, and app-centric creation more than a direct campaign production path.",
    recommendation: "Choose for iterative exploration",
  }
];

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="text-center mb-10 sm:mb-12">
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
        {title}
      </h2>
      {description && (
        <p className="text-base sm:text-lg text-white/50 leading-relaxed max-w-3xl mx-auto">
          {description}
        </p>
      )}
    </div>
  );
}

function CardGrid({
  items,
  columns = "md:grid-cols-2",
}: {
  items: ContentCard[];
  columns?: string;
}) {
  return (
    <div className={`grid grid-cols-1 ${columns} gap-5 sm:gap-6`}>
      {items.map((item) => (
        <article
          key={item.title}
          className="rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6 sm:p-7 shadow-[0_10px_40px_rgba(0,0,0,0.22)] transition-colors hover:border-primary/30"
        >
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-4">
            VEO 4
          </div>
          <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3">{item.title}</h3>
          <p className="text-sm sm:text-base leading-7 text-white/65">{item.description}</p>
        </article>
      ))}
    </div>
  );
}

function ComparisonSection({ rows }: { rows: CompareRow[] }) {
  const [primary, ...others] = rows;
  const renderCompareLink = (row: CompareRow, isPrimary: boolean) => {
    if (!row.href) return null;

    const className = isPrimary
      ? "mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      : "mt-6 inline-flex items-center justify-center rounded-xl border border-white/[0.14] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.08]";

    if (row.href.startsWith("http")) {
      return (
        <a
          href={row.href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {row.ctaLabel || "Learn more"}
        </a>
      );
    }

    return (
      <Link href={row.href} className={className}>
        {row.ctaLabel || "Explore this workflow"}
      </Link>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-7">
      <article className="rounded-[2rem] border border-primary/30 bg-gradient-to-br from-primary/16 via-white/[0.06] to-transparent p-7 sm:p-8 shadow-[0_16px_60px_rgba(0,0,0,0.28)]">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="text-2xl sm:text-3xl font-semibold text-white">{primary.model}</div>
              {primary.recommendation && (
                <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground">
                  {primary.recommendation}
                </span>
              )}
            </div>
            <p className="text-base sm:text-lg leading-8 text-white/75">{primary.bestFor}</p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.08] bg-black/15 p-5">
                <div className="text-white/40 uppercase tracking-[0.18em] text-[11px] mb-2">Strengths</div>
                <p className="text-sm sm:text-base leading-7 text-white/80">{primary.strengths}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-black/15 p-5">
                <div className="text-white/40 uppercase tracking-[0.18em] text-[11px] mb-2">Choose when</div>
                <p className="text-sm sm:text-base leading-7 text-white/80">{primary.chooseWhen}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-black/20 p-5 sm:p-6">
            <div className="text-white/40 uppercase tracking-[0.18em] text-[11px] mb-2">Why it wins for teams</div>
            <p className="text-sm sm:text-base leading-7 text-white/80">
              VEO 4 is the most practical default choice when the goal is not just visual quality, but actually shipping ad concepts, landing-page media, and social creative faster.
            </p>
            {renderCompareLink(primary, true)}
          </div>
        </div>
      </article>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {others.map((row) => (
          <article
            key={`${row.model}-highlight`}
            className="rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6 sm:p-7 shadow-[0_10px_40px_rgba(0,0,0,0.22)] transition-colors hover:border-white/[0.14]"
          >
            <div className="flex flex-col gap-3 mb-5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-2xl font-semibold text-white">{row.model}</div>
                {row.recommendation && (
                  <span className="rounded-full border border-white/[0.12] bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
                    {row.recommendation}
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base text-white/55 leading-7">{row.bestFor}</p>
            </div>

            <div className="space-y-4 text-sm leading-7">
              <div>
                <div className="text-white/40 uppercase tracking-[0.18em] text-[11px] mb-1">Strengths</div>
                <p className="text-white/75">{row.strengths}</p>
              </div>
              <div>
                <div className="text-white/40 uppercase tracking-[0.18em] text-[11px] mb-1">Choose when</div>
                <p className="text-white/75">{row.chooseWhen}</p>
              </div>
            </div>

            {renderCompareLink(row, false)}
          </article>
        ))}
      </div>
    </div>
  );
}

function CTASection() {
  return (
    <section className="rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/14 via-white/[0.04] to-transparent p-8 sm:p-10 shadow-[0_16px_50px_rgba(0,0,0,0.25)]">
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
        Start Creating with VEO 4
      </h2>
      <p className="text-base sm:text-lg text-white/65 leading-8 max-w-3xl">
        Evaluate VEO 4 by the outcomes it helps you reach: faster first drafts, stronger ad
        testing, clearer product storytelling, and less friction between idea and execution.
        The best platform is the one that helps your team learn faster and ship better video.
      </p>
      <div className="mt-7 flex flex-col sm:flex-row gap-3">
        <Link
          href="/veo4-text-to-video"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try Text to Video
        </Link>
        <Link
          href="/veo4-image-to-video"
          className="inline-flex items-center justify-center rounded-xl border border-white/[0.14] bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.08]"
        >
          Try Image to Video
        </Link>
      </div>
    </section>
  );
}

const Veo4KnowledgeSection = () => {
  const locale = useLocale();

  if (locale !== "en") {
    return null;
  }

  return (
    <section className="py-24 sm:py-32 bg-background border-t border-border/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-16 sm:space-y-20">
          <section>
            <SectionHeader
              title="What You Can Create with VEO 4"
              description="Use VEO 4 for ad concepts, social formats, product storytelling, and motion-first prototypes that shorten the gap between idea and output."
            />
            <CardGrid items={creationCards} />
          </section>

          <section>
            <SectionHeader
              title="Why VEO 4 Works for Advertising"
              description="The value of VEO 4 is not only visual quality. It is the speed, variation, and workflow efficiency it brings to real campaign production."
            />
            <CardGrid items={advertisingCards} />
          </section>

          <section>
            <SectionHeader
              title="VEO 4 vs Other Models"
              description="Compare VEO 4 with Veo 3, Seedance 2.0, Kling, and Sora 2 to see which model fits campaign production, realism-focused work, or heavier editing workflows."
            />
            <ComparisonSection rows={comparisonRows} />
            <p className="mt-5 text-center text-sm text-white/35 leading-6 max-w-4xl mx-auto">
              Comparison summary based on public product materials from Google, ByteDance Seed, OpenAI, and Kuaishou reviewed in April 2026.
            </p>
          </section>

          <CTASection />
        </div>
      </div>
    </section>
  );
};

export default Veo4KnowledgeSection;
