"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/types";

export const LangContext = createContext<Locale>("zh");

type LangProviderProps = {
  children: ReactNode;
  lang: Locale;
};

export function LangProvider({ children, lang }: LangProviderProps) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
