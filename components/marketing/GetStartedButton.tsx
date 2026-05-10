"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  type CSSProperties,
  type ReactNode,
} from "react";

export function GetStartedButton({
  className,
  style,
  children = "Get started →",
}: {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/signin");
  }, [router]);

  const handleClick = useCallback(() => {
    router.push("/signin");
  }, [router]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      style={style}
    >
      {children}
    </button>
  );
}
