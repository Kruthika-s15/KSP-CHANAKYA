'use client';

import { useEffect, useRef } from 'react';

interface StarfieldProps {
  starCount?: number;
  waveFrequency?: number;
  starEscapeWidth?: number;
  voidWidth?: number;
  starColor?: { r: number; g: number; b: number };
  maxOpacity?: number;
  rotationSpeed?: number;
  waveSpeed?: number;
}

export const Starfield = ({
  starCount = 3500,
  waveFrequency = 18,
  starEscapeWidth = 500,
  voidWidth = 40,
  starColor = { r: 0, g: 230, b: 130 },
  maxOpacity = 255,
  rotationSpeed = 0.0015,
  waveSpeed = 0.012,
}: StarfieldProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = container.clientWidth);
    let height = (canvas.height = container.clientHeight);

    const handleResize = () => {
      if (!container || !canvas) return;
      width = canvas.width = container.clientWidth;
      height = canvas.height = container.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Generate larger, brighter, high-visibility stars
    const stars = Array.from({ length: starCount }, () => ({
      x: (Math.random() - 0.5) * width * 1.8,
      y: (Math.random() - 0.5) * height * 1.8,
      size: Math.random() * 1.6 + 0.6,
      opacity: Math.random() * 0.6 + 0.2,
      speed: Math.random() * 0.8 + 0.3,
    }));

    let angle = 0;

    const render = () => {
      // Background clear with high contrast
      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.fillRect(0, 0, width, height);

      angle += rotationSpeed;
      const cx = width / 2;
      const cy = height / 2;

      stars.forEach((star) => {
        const cos = Math.cos(rotationSpeed);
        const sin = Math.sin(rotationSpeed);

        const nx = star.x * cos - star.y * sin;
        const ny = star.x * sin + star.y * cos;
        star.x = nx;
        star.y = ny;

        const waveX = Math.sin(angle * 10 + star.y * 0.01) * waveFrequency * 0.2;
        const waveY = Math.cos(angle * 10 + star.x * 0.01) * waveFrequency * 0.2;

        const screenX = cx + star.x + waveX;
        const screenY = cy + star.y + waveY;

        if (screenX >= 0 && screenX <= width && screenY >= 0 && screenY <= height) {
          ctx.beginPath();
          ctx.arc(screenX, screenY, star.size, 0, Math.PI * 2);

          ctx.shadowBlur = 0;

          ctx.fillStyle = `rgba(${starColor.r}, ${starColor.g}, ${starColor.b}, ${star.opacity})`;
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [starCount, waveFrequency, starEscapeWidth, voidWidth, starColor, maxOpacity, rotationSpeed, waveSpeed]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};