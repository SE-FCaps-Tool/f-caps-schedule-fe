"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useReducedMotion } from "motion/react";

export function FormBlob() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -top-24 -right-32 size-112 opacity-60 blur-3xl"
    >
      <DotLottieReact
        src="/branding/form-blob.lottie"
        loop
        autoplay={!reduceMotion}
        className="h-full w-full"
      />
    </div>
  );
}
