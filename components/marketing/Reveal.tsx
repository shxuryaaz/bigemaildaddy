"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "fade";

const OFFSETS: Record<Direction, string> = {
  up:    "translate(0, 36px)",
  down:  "translate(0, -36px)",
  left:  "translate(-36px, 0)",
  right: "translate(36px, 0)",
  fade:  "translate(0, 0)",
};

export function Reveal({
  children,
  className,
  delay = 0,
  from = "up",
  style,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  from?: Direction;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? "translate(0,0)" : OFFSETS[from],
        transition: `opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)`,
        transitionDelay: `${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
