import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://baoqin.blog"),
  title: {
    default: "宝勤 | Baoqin",
    template: "%s | 宝勤",
  },
  description: "A minimal bilingual personal blog built with local Markdown files.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full bg-canvas">{children}</body>
    </html>
  );
}
