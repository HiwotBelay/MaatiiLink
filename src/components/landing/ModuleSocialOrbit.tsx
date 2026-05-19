"use client";

import {
  Activity,
  FileCheck2,
  Megaphone,
  TicketCheck,
} from "lucide-react";
import { SocialOrbit } from "@/components/ui/social-orbit";

export function ModuleSocialOrbit() {
  return (
    <div className="landing-module-orbit-wrap">
      <SocialOrbit
        size={320}
        rippleCount={3}
        rippleDuration={3}
        text="EOD*Incidents*Directives*Service*desk"
        textOrbitIndex={3}
        textDuration={28}
        orbitDuration={36}
        iconDelay={180}
        iconDuration={900}
        textClassName="landing-orbit-text"
        icons={[
          { icon: <FileCheck2 className="size-5" />, orbitIndex: 1, position: 0 },
          { icon: <Activity className="size-5" />, orbitIndex: 1, position: 90 },
          { icon: <Megaphone className="size-5" />, orbitIndex: 2, position: 180 },
          { icon: <TicketCheck className="size-5" />, orbitIndex: 2, position: 270 },
        ]}
      >
        <div className="landing-orbit-center flex size-16 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] shadow-[0_12px_40px_rgba(0,82,155,0.15)]">
          <span className="text-center text-[0.65rem] font-extrabold uppercase leading-tight tracking-[0.14em] text-[var(--primary)]">
            Core
            <br />
            Modules
          </span>
        </div>
      </SocialOrbit>
    </div>
  );
}
