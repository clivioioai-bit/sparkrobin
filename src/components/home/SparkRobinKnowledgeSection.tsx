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
    title: "Prompt libraries for campaign teams",
    description:
      "Capture product angles, audience objections, offer hooks, visual rules, and camera notes in a format your team can reuse across drafts."
  },
  {
    title: "Reference packs for visual consistency",
    description:
      "Collect product photos, style frames, brand colors, and example shots before rendering, so each draft starts with a stronger visual anchor."
  },
  {
    title: "Shot notes for reviewable motion",
    description:
      "Write motion, camera, pacing, and continuity notes separately from the core prompt so reviewers can see what changed between versions."
  },
  {
    title: "Release-aware content planning",
    description:
      "Build pages and workflows around confirmed updates and clearly labeled assumptions instead of recycling unsupported model claims."
  }
];

const advertisingCards: ContentCard[] = [
  {
    title: "Less speculative messaging",
    description:
      "Keep the difference between Spark Robin rumors, official Google documentation, and your own workflow capabilities visible."
  },
  {
    title: "More useful first drafts",
    description:
      "A structured brief gives each generated clip a purpose, which makes feedback sharper and the next version easier to improve."
  },
  {
    title: "Reusable learning across models",
    description:
      "The prompt system you build now can carry into Veo, Sora, Runway, Kling, or future Spark Robin access."
  },
  {
    title: "Better editorial trust",
    description:
      "Pages that are careful about uncertainty are easier to update when official specs, pricing, or access paths finally change."
  }
];

const comparisonRows: CompareRow[] = [
  {
    model: "Spark Robin Workspace",
    bestFor: "Teams preparing prompt systems, reference assets, and draft reviews around Spark Robin interest",
    strengths: "Release-watch framing, structured prompts, image-led drafts, reusable shot notes, and a practical workflow for current production",
    chooseWhen: "You want to keep producing AI video drafts while staying honest about what Google has and has not confirmed.",
    recommendation: "Best for preparation",
    href: "/spark-robin-text-to-video",
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
            Spark Robin
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
              The Spark Robin workspace is strongest when the job is preparation: organizing prompts, references, assumptions, and review notes so your team can move faster when model access changes.
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
        Build a Spark Robin-Ready Workflow
      </h2>
      <p className="text-base sm:text-lg text-white/65 leading-8 max-w-3xl">
        Do not wait for rumors to settle before improving your workflow. Build reusable prompt
        structures, organize reference assets, and create drafts your team can review today.
      </p>
      <div className="mt-7 flex flex-col sm:flex-row gap-3">
        <Link
          href="/spark-robin-text-to-video"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try Text to Video
        </Link>
        <Link
          href="/spark-robin-image-to-video"
          className="inline-flex items-center justify-center rounded-xl border border-white/[0.14] bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.08]"
        >
          Try Image to Video
        </Link>
      </div>
    </section>
  );
}

const SparkRobinKnowledgeSection = () => {
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
              title="What to Prepare for Spark Robin"
              description="Use this workspace to organize prompt libraries, references, shot notes, and release-aware content before official model details are stable."
            />
            <CardGrid items={creationCards} />
          </section>

          <section>
            <SectionHeader
              title="Why the New Copy Should Be Different"
              description="Spark Robin content should not sound like a recycled model page. It should communicate uncertainty clearly and give creators something practical to do now."
            />
            <CardGrid items={advertisingCards} />
          </section>

          <section>
            <SectionHeader
              title="Spark Robin Workspace vs Other Models"
              description="Compare the preparation workflow here with Veo 3, Seedance 2.0, Kling, and Sora 2 so teams can choose between release watching, realism, control, and editing depth."
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

export default SparkRobinKnowledgeSection;
