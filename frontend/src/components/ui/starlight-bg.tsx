"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  opacityDirection: number;
}

export default function StarlightBg() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      generateStars();
    };

    const generateStars = () => {
      const count = 160;
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.6 + 0.2,
        opacityDirection: Math.random() > 0.5 ? 1 : -1,
      }));
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Pure black background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const s of stars) {
        // Move
        s.x += s.vx;
        s.y += s.vy;

        // Bounce off edges
        if (s.x < 0 || s.x > canvas.width) s.vx *= -1;
        if (s.y < 0 || s.y > canvas.height) s.vy *= -1;
        s.x = Math.max(0, Math.min(canvas.width, s.x));
        s.y = Math.max(0, Math.min(canvas.height, s.y));

        // Twinkle — gently oscillate opacity
        s.opacity += s.opacityDirection * 0.003;
        if (s.opacity >= 0.85) { s.opacity = 0.85; s.opacityDirection = -1; }
        if (s.opacity <= 0.15) { s.opacity = 0.15; s.opacityDirection = 1; }

        // Soft glow halo
        const glowRadius = s.radius * 4;
        const glow = ctx.createRadialGradient(
          s.x, s.y, 0,
          s.x, s.y, glowRadius
        );
        glow.addColorStop(0, `rgba(0, 255, 136, ${s.opacity * 0.3})`);
        glow.addColorStop(1, "rgba(0, 255, 136, 0)");
        ctx.beginPath();
        ctx.arc(s.x, s.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core bright green dot
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 136, ${s.opacity})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
      aria-hidden="true"
    />
  );
}
