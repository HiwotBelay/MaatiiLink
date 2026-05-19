"use client";

import VenomBeam from "@/components/ui/venom-beam";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function VenomBeamBackground({ children, className = "" }: Props) {
  return (
    <VenomBeam className={`venom-beam-page ${className}`}>{children}</VenomBeam>
  );
}
