"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/types";

export type ContactMethod = {
  channel: "wechat" | "qq" | "email";
  label: string;
  value: string;
};

type ContactMethodsProps = {
  locale: Locale;
  methods: ReadonlyArray<ContactMethod>;
};

const uiCopy = {
  zh: {
    copied: "\u5df2\u590d\u5236",
    copy: "\u590d\u5236",
  },
  en: {
    copied: "Copied",
    copy: "Copy",
  },
} as const;

export default function ContactMethods({
  locale,
  methods,
}: ContactMethodsProps) {
  const [copiedChannel, setCopiedChannel] = useState<ContactMethod["channel"] | null>(
    null,
  );
  const resetTimerRef = useRef<number | null>(null);
  const copy = uiCopy[locale];

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  async function handleCopy(channel: ContactMethod["channel"], value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedChannel(channel);

      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }

      resetTimerRef.current = window.setTimeout(() => {
        setCopiedChannel(null);
      }, 1600);
    } catch {
      setCopiedChannel(null);
    }
  }

  return (
    <div className="contact-method-grid">
      {methods.map((method) => {
        const isCopied = copiedChannel === method.channel;

        return (
          <article key={method.channel} className="contact-method-card">
            <div className="contact-method-top">
              <p className="contact-method-label">{method.label}</p>
            </div>

            <p className="contact-method-value">{method.value}</p>

            <div className="contact-method-actions contact-method-actions-compact">
              <button
                type="button"
                className="contact-method-button contact-method-button-primary"
                onClick={() => handleCopy(method.channel, method.value)}
              >
                {isCopied ? copy.copied : copy.copy}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
