"use client";

import { motion } from "motion/react";
import {
  Children,
  isValidElement,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type SocialIcon = {
  icon: ReactNode;
  orbitIndex?: number;
  position?: number;
};

type SocialOrbitProps = {
  icons?: SocialIcon[];
  text?: string;
  textClassName?: string;
  textOrbitIndex?: number;
  children?: ReactNode;
  rippleCount?: number;
  rippleDuration?: number;
  textDuration?: number;
  iconDelay?: number;
  iconDuration?: number;
  orbitDuration?: number;
  size?: number;
  className?: string;
};

function orbitRadius(size: number, rippleCount: number, orbitIndex: number) {
  const max = size * 0.42;
  const min = size * 0.14;
  if (rippleCount <= 1) return max;
  const step = (max - min) / (rippleCount - 1);
  return min + step * Math.max(0, orbitIndex - 1);
}

export function SocialOrbit({
  icons = [],
  text = "",
  textClassName = "",
  textOrbitIndex = 2,
  children,
  rippleCount = 5,
  rippleDuration = 2,
  textDuration = 20,
  iconDelay = 150,
  iconDuration = 800,
  orbitDuration = 30,
  size = 500,
  className = "",
}: SocialOrbitProps) {
  const letters = useMemo(
    () => (text ? text.split("").filter((char) => char !== " ") : []),
    [text],
  );

  const iconsByOrbit = useMemo(() => {
    const map = new Map<number, SocialIcon[]>();
    icons.forEach((item) => {
      const index = item.orbitIndex ?? 1;
      const list = map.get(index) ?? [];
      list.push(item);
      map.set(index, list);
    });
    return map;
  }, [icons]);

  const textRadius = orbitRadius(size, rippleCount, textOrbitIndex);

  return (
    <div
      className={cn("social-orbit-root relative select-none", className)}
      style={{ width: size, height: size }}
      aria-hidden={!children && icons.length === 0 && !text}
    >
      {Array.from({ length: rippleCount }).map((_, index) => {
        const ring = index + 1;
        const radius = orbitRadius(size, rippleCount, ring);
        const diameter = radius * 2;
        return (
          <motion.div
            key={`ripple-${ring}`}
            className="social-orbit-ripple pointer-events-none absolute left-1/2 top-1/2 rounded-full border border-[var(--primary)]/20"
            style={{
              width: diameter,
              height: diameter,
              marginLeft: -radius,
              marginTop: -radius,
            }}
            animate={{
              scale: [1, 1.04, 1],
              opacity: [0.22, 0.42, 0.22],
            }}
            transition={{
              duration: rippleDuration + index * 0.15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.2,
            }}
          />
        );
      })}

      {Array.from(iconsByOrbit.entries()).map(([orbitIndex, orbitIcons]) => {
        const radius = orbitRadius(size, rippleCount, orbitIndex);
        return (
          <motion.div
            key={`orbit-${orbitIndex}`}
            className="pointer-events-none absolute left-1/2 top-1/2"
            style={{ width: 0, height: 0 }}
            animate={{ rotate: 360 }}
            transition={{
              duration: orbitDuration,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {orbitIcons.map((item, iconIndex) => {
              const angle = ((item.position ?? iconIndex * 45) * Math.PI) / 180;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              return (
                <motion.div
                  key={`icon-${orbitIndex}-${iconIndex}`}
                  className="social-orbit-icon absolute flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--primary)] shadow-[0_8px_24px_rgba(0,82,155,0.12)]"
                  style={{ left: x, top: y }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotate: -360,
                  }}
                  transition={{
                    opacity: { duration: iconDuration / 1000, delay: iconIndex * (iconDelay / 1000) },
                    scale: { duration: iconDuration / 1000, delay: iconIndex * (iconDelay / 1000) },
                    rotate: {
                      duration: orbitDuration,
                      repeat: Infinity,
                      ease: "linear",
                    },
                  }}
                >
                  {item.icon}
                </motion.div>
              );
            })}
          </motion.div>
        );
      })}

      {letters.length > 0 ? (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2"
          style={{ width: 0, height: 0 }}
          animate={{ rotate: 360 }}
          transition={{
            duration: textDuration,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {letters.map((char, index) => {
            const angle = (index / letters.length) * 2 * Math.PI - Math.PI / 2;
            const x = Math.cos(angle) * textRadius;
            const y = Math.sin(angle) * textRadius;
            const rotate = (index / letters.length) * 360 + 90;
            return (
              <span
                key={`${char}-${index}`}
                className={cn(
                  "social-orbit-letter absolute font-bold uppercase tracking-[0.18em] text-[var(--primary)]",
                  textClassName,
                )}
                style={
                  {
                    left: x,
                    top: y,
                    transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
                    fontSize: char === "*" ? "0.55rem" : "0.62rem",
                    opacity: char === "*" ? 0.45 : 0.9,
                  } as CSSProperties
                }
              >
                {char === "*" ? "•" : char}
              </span>
            );
          })}
        </motion.div>
      ) : null}

      {children ? (
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          {Children.map(children, (child) =>
            isValidElement(child) ? child : null,
          )}
        </div>
      ) : null}
    </div>
  );
}
