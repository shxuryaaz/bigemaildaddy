"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

const EXIT_MS = 420;

export function AuthLoadingOverlay({
  open,
  message = "Loading…",
  onExitComplete,
}: {
  open: boolean;
  message?: string;
  onExitComplete?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [portalOn, setPortalOn] = useState(false);
  const [visible, setVisible] = useState(false);
  const exitCallbackRef = useRef(onExitComplete);

  useEffect(() => {
    exitCallbackRef.current = onExitComplete;
  }, [onExitComplete]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !open) return;
    setPortalOn(true);
    setVisible(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(id);
  }, [open, mounted]);

  useEffect(() => {
    if (!mounted || open || !portalOn) return;
    setVisible(false);
    const timer = window.setTimeout(() => {
      setPortalOn(false);
      exitCallbackRef.current?.();
    }, EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [open, portalOn, mounted]);

  if (!mounted || !portalOn) return null;

  const layerStyle: CSSProperties = {
    fontFamily: "var(--font-mono), monospace",
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#faf8f4]/65 backdrop-blur-lg transition-[opacity,backdrop-filter] duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={layerStyle}
      aria-busy={true}
    >
      <div
        className={`flex flex-col items-center transition-[opacity,transform] duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-3 scale-[0.95] opacity-0"
        }`}
      >
        <div className="animate-pulse">
          <Image
            src="/logo.png"
            alt=""
            width={200}
            height={200}
            className="h-auto w-[min(52vw,200px)] object-contain md:w-[220px]"
            priority
          />
        </div>
        <p
          role="status"
          className="mt-8 max-w-[90vw] text-center text-[12px] font-medium uppercase leading-relaxed tracking-[0.18em] text-[#5a5850] md:mt-10 md:text-[13px]"
          aria-live="polite"
        >
          {message}
        </p>
      </div>
    </div>,
    document.body,
  );
}
