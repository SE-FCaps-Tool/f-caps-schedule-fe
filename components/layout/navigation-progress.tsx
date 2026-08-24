"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const NAVIGATION_START_EVENT = "app:navigation-start";

export function startNavigationProgress() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NAVIGATION_START_EVENT));
  }
}

function isModifiedClick(event: MouseEvent) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const finish = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setIsNavigating(false);
    };

    finish();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    const start = () => {
      setIsNavigating(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        setIsNavigating(false);
      }, 8000);
    };

    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || isModifiedClick(event)) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const nextUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      const isSameRoute = nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search;

      if (nextUrl.origin !== currentUrl.origin || (isSameRoute && nextUrl.hash !== currentUrl.hash)) return;
      if (isSameRoute && nextUrl.hash === currentUrl.hash) return;

      start();
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", start);
    window.addEventListener(NAVIGATION_START_EVENT, start);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", start);
      window.removeEventListener(NAVIGATION_START_EVENT, start);
    };
  }, []);

  if (!isNavigating) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-primary/15"
      role="status"
      aria-label="Đang chuyển trang"
    >
      <div className="h-full w-2/5 animate-[navigation-progress_1.1s_ease-in-out_infinite] bg-primary motion-reduce:animate-none" />
    </div>
  );
}
