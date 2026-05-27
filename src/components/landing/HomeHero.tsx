"use client";

import { GlitchText } from "./GlitchText";
import { TrueFocus } from "./TrueFocus";

const HERO_SENTENCE =
  "EOD incidents directives service desk compliance audit one secure workspace";

export function HomeHero() {
  return (
    <section className="landing-hero-glow" aria-label="MaatiiLink introduction">
      <div className="landing-hero-glow-border" aria-hidden />
      <div className="landing-hero-focus">
        <div className="landing-glitch-wrap">
          <GlitchText
            as="h1"
            shadowDurationA="7s"
            shadowDurationB="8.5s"
            enableOnHover
            className="landing-glitch-title"
          >
            MaatiiLink
          </GlitchText>
        </div>
        <p className="landing-subtitle mx-auto">
          Branch-to-Head Office operations — EOD, incidents, directives, and
          internal service requests in one workspace.
        </p>
        <div className="mt-8">
          <TrueFocus
            sentence={HERO_SENTENCE}
            blurAmount={4}
            borderColor="#00d2ff"
            glowColor="rgba(0, 210, 255, 0.5)"
            animationDuration={0.45}
            pauseBetweenAnimations={0.8}
          />
        </div>
      </div>
    </section>
  );
}
