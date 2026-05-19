"use client";

import type { CSSProperties } from "react";

type GlitchTextProps = {
  children: string;
  shadowDurationA?: string;
  shadowDurationB?: string;
  enableOnHover?: boolean;
  className?: string;
  as?: "h1" | "p" | "span";
};

type GlitchStyles = CSSProperties & {
  "--shadow-duration-a"?: string;
  "--shadow-duration-b"?: string;
};

export function GlitchText({
  children,
  shadowDurationA = "6s",
  shadowDurationB = "7.5s",
  enableOnHover = false,
  className = "",
  as: Tag = "span",
}: GlitchTextProps) {
  const inlineStyles: GlitchStyles = {
    "--shadow-duration-a": shadowDurationA,
    "--shadow-duration-b": shadowDurationB,
  };

  const modeClass = enableOnHover ? "glitch-text-hover" : "glitch-text-active";

  return (
    <Tag
      style={inlineStyles}
      data-text={children}
      className={`glitch-text ${modeClass} ${className}`}
      tabIndex={enableOnHover ? 0 : undefined}
    >
      {children}
    </Tag>
  );
}
