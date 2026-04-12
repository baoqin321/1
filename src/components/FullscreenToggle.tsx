"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/context";

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
};

const labels = {
  zh: {
    enter: "\u5168\u5c4f",
    exit: "\u8fd8\u539f",
  },
  en: {
    enter: "Full",
    exit: "Exit",
  },
} as const;

export default function FullscreenToggle() {
  const lang = useLang();
  const copy = labels[lang];
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const syncFullscreenState = () => {
      const fullscreenDocument = document as FullscreenDocument;

      setIsFullscreen(
        Boolean(
          fullscreenDocument.fullscreenElement ??
            fullscreenDocument.webkitFullscreenElement ??
            fullscreenDocument.msFullscreenElement,
        ),
      );
    };

    document.addEventListener("fullscreenchange", syncFullscreenState);
    document.addEventListener("webkitfullscreenchange", syncFullscreenState);
    document.addEventListener("MSFullscreenChange", syncFullscreenState);

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
      document.removeEventListener("webkitfullscreenchange", syncFullscreenState);
      document.removeEventListener("MSFullscreenChange", syncFullscreenState);
    };
  }, []);

  async function toggleFullscreen() {
    const fullscreenDocument = document as FullscreenDocument;
    const fullscreenTarget = document.documentElement as FullscreenElement;
    const currentFullscreenElement =
      fullscreenDocument.fullscreenElement ??
      fullscreenDocument.webkitFullscreenElement ??
      fullscreenDocument.msFullscreenElement;

    try {
      if (currentFullscreenElement) {
        if (typeof fullscreenDocument.exitFullscreen === "function") {
          await fullscreenDocument.exitFullscreen();
        } else if (typeof fullscreenDocument.webkitExitFullscreen === "function") {
          await fullscreenDocument.webkitExitFullscreen();
        } else if (typeof fullscreenDocument.msExitFullscreen === "function") {
          await fullscreenDocument.msExitFullscreen();
        }
      } else if (typeof fullscreenTarget.requestFullscreen === "function") {
        await fullscreenTarget.requestFullscreen();
      } else if (typeof fullscreenTarget.webkitRequestFullscreen === "function") {
        await fullscreenTarget.webkitRequestFullscreen();
      } else if (typeof fullscreenTarget.msRequestFullscreen === "function") {
        await fullscreenTarget.msRequestFullscreen();
      }
    } catch {
      // Keep the visible state honest if the browser rejects the request.
    } finally {
      setIsFullscreen(
        Boolean(
          fullscreenDocument.fullscreenElement ??
            fullscreenDocument.webkitFullscreenElement ??
            fullscreenDocument.msFullscreenElement,
        ),
      );
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-8">
      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? copy.exit : copy.enter}
        title={isFullscreen ? copy.exit : copy.enter}
        className="site-ui flex items-center gap-3 rounded-[0.85rem] border border-line/90 bg-[rgba(9,13,18,0.82)] px-4 py-2.5 text-[0.68rem] uppercase tracking-[0.16em] text-white transition hover:border-line-strong hover:text-white"
      >
        <span aria-hidden="true" className="relative block h-3.5 w-3.5">
          <span className="absolute left-0 top-0 h-[0.42rem] w-[0.42rem] border-l border-t border-current" />
          <span className="absolute right-0 top-0 h-[0.42rem] w-[0.42rem] border-r border-t border-current" />
          <span className="absolute bottom-0 left-0 h-[0.42rem] w-[0.42rem] border-b border-l border-current" />
          <span className="absolute bottom-0 right-0 h-[0.42rem] w-[0.42rem] border-b border-r border-current" />
        </span>
        <span>{isFullscreen ? copy.exit : copy.enter}</span>
      </button>
    </div>
  );
}
