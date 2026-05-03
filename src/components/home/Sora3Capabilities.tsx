"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CAPABILITY_VIDEO_PATHS } from "@/config/demoVideos";

const Sora3Capabilities = () => {
  const t = useTranslations("sora3Capabilities");

  const capabilities = [
    {
      id: "spark-robin-text-and-image-input",
      title: t("cinematicRealism.title"),
      description: t("cinematicRealism.description"),
      videoUrl: CAPABILITY_VIDEO_PATHS.cinematic,
      tag: "Text + Image",
    },
    {
      id: "spark-robin-motion-and-camera-control",
      title: t("naturalCameraMotion.title"),
      description: t("naturalCameraMotion.description"),
      videoUrl: CAPABILITY_VIDEO_PATHS.camera,
      tag: "Motion",
    },
    {
      id: "spark-robin-ads-social-and-product-content",
      title: t("consistentCharacters.title"),
      description: t("consistentCharacters.description"),
      videoUrl: CAPABILITY_VIDEO_PATHS.characters,
      tag: "Ads + Social",
    },
    {
      id: "spark-robin-longer-clips-and-exports",
      title: t("longFormPlatformReady.title"),
      description: t("longFormPlatformReady.description"),
      videoUrl: CAPABILITY_VIDEO_PATHS.longform,
      tag: "Longer Clips",
    },
  ];
  const getVideoType = (src: string) => src.endsWith(".webm") ? "video/webm" : "video/mp4";

  return (
    <section className="py-24 sm:py-32 lg:py-36 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.03),transparent)] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-tight tracking-tight"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif' }}
          >
            {t("title")}
          </h2>
          <p className="mt-4 max-w-3xl mx-auto text-base sm:text-lg text-white/45 leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7">
          {capabilities.map((capability) => (
            <section
              key={capability.title}
              aria-labelledby={capability.id}
              className="rounded-3xl overflow-hidden border border-white/[0.08] bg-card/70 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
            >
              <div className="relative aspect-video bg-black">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                >
                  <source src={capability.videoUrl} type={getVideoType(capability.videoUrl)} />
                </video>

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 text-[10px] font-semibold rounded-full bg-black/50 backdrop-blur-xl text-white/75 border border-white/10 uppercase tracking-[0.18em]">
                    {capability.tag}
                  </span>
                </div>
              </div>

              <div className="px-6 sm:px-7 py-6 sm:py-7">
                <h3
                  id={capability.id}
                  className="text-xl sm:text-2xl font-semibold text-white mb-3 tracking-tight"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif' }}
                >
                  {capability.title}
                </h3>
                <p className="text-sm sm:text-base text-white/45 leading-7">
                  {capability.description}
                </p>
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Sora3Capabilities;
