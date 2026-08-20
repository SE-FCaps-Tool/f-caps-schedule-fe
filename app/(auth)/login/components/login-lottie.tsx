"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useReducedMotion } from "motion/react";

export function LoginLottie() {
  const reduceMotion = useReducedMotion();

  return (
    <DotLottieReact
      src="/branding/login-man-laptop.lottie"
      loop
      autoplay={!reduceMotion}
      className="h-full w-full"
    />
  );
}
