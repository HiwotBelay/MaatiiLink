"use client";

import { useEffect, useRef } from "react";
import { getThemeSnapshot } from "@/components/theme/ThemeProvider";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
};

type VenomBeamProps = {
  children?: React.ReactNode;
  className?: string;
};

function isDarkTheme() {
  return getThemeSnapshot() === "dark";
}

export default function VenomBeam({
  children,
  className = "",
}: VenomBeamProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const paintStatic = () => {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        ctx.fillStyle = isDarkTheme() ? "#030a14" : "#f6f9ff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      };
      paintStatic();
      const onThemeChange = () => paintStatic();
      window.addEventListener("maatiilink-theme-change", onThemeChange);
      return () =>
        window.removeEventListener("maatiilink-theme-change", onThemeChange);
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const paintBackground = () => {
      if (isDarkTheme()) {
        ctx.fillStyle = "#030a14";
      } else {
        ctx.fillStyle = "#f6f9ff";
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      paintBackground();
    };

    resizeCanvas();

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resizeCanvas();
        initParticles();
      }, 100);
    };

    window.addEventListener("resize", handleResize);

    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < 90; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 0,
          maxLife: Math.random() * 100 + 50,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.8 + 0.2,
        });
      }
    };

    initParticles();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      const dark = isDarkTheme();

      ctx.fillStyle = dark
        ? "rgba(3, 10, 20, 0.08)"
        : "rgba(246, 249, 255, 0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life++;

        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150 && distance > 0) {
          const force = (150 - distance) / 150;
          particle.vx += (dx / distance) * force * 0.12;
          particle.vy += (dy / distance) * force * 0.12;
        }

        particle.vx *= 0.99;
        particle.vy *= 0.99;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -0.8;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -0.8;

        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));

        if (particle.life > particle.maxLife) {
          particle.x = Math.random() * canvas.width;
          particle.y = Math.random() * canvas.height;
          particle.vx = (Math.random() - 0.5) * 2;
          particle.vy = (Math.random() - 0.5) * 2;
          particle.life = 0;
          particle.maxLife = Math.random() * 100 + 50;
        }

        const alpha = particle.opacity * (1 - particle.life / particle.maxLife);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);

        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size * 2,
        );

        if (dark) {
          gradient.addColorStop(0, `rgba(0, 210, 255, ${alpha})`);
          gradient.addColorStop(0.5, `rgba(0, 130, 200, ${alpha * 0.75})`);
          gradient.addColorStop(1, `rgba(0, 82, 155, ${alpha * 0.25})`);
        } else {
          gradient.addColorStop(0, `rgba(0, 82, 155, ${alpha * 0.9})`);
          gradient.addColorStop(0.5, `rgba(56, 189, 248, ${alpha * 0.65})`);
          gradient.addColorStop(1, `rgba(0, 82, 155, ${alpha * 0.2})`);
        }

        ctx.fillStyle = gradient;
        ctx.fill();
      });

      particlesRef.current.forEach((particle, i) => {
        particlesRef.current.slice(i + 1).forEach((other) => {
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            const alpha = ((100 - distance) / 100) * 0.28;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = dark
              ? `rgba(0, 210, 255, ${alpha})`
              : `rgba(0, 82, 155, ${alpha * 0.55})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const onThemeChange = () => paintBackground();
    window.addEventListener("maatiilink-theme-change", onThemeChange);

    const themeObserver = new MutationObserver(onThemeChange);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("maatiilink-theme-change", onThemeChange);
      canvas.removeEventListener("mousemove", handleMouseMove);
      themeObserver.disconnect();
      clearTimeout(resizeTimeout);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className={`venom-beam-root ${className}`}>
      <canvas ref={canvasRef} className="venom-beam-canvas" aria-hidden />
      {children ? <div className="venom-beam-content">{children}</div> : null}
    </div>
  );
}
