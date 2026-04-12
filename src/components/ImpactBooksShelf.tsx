"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import type { Locale } from "@/lib/types";

type ImpactBooksShelfProps = {
  lang: Locale;
};

const copy = {
  zh: {
    title: "\u5bf9\u6211\u5f71\u54cd\u6700\u5927\u7684\u4e66\u7c4d",
  },
  en: {
    title: "Books That Shaped Me Most",
  },
} as const;

const books = [
  {
    alt: "Cover of My Inventions: The Autobiography of Nikola Tesla",
    description: {
      en: "Tesla's way of thinking and acting shocked and inspired me so deeply that after finishing this book, he became a figure I look up to in spirit.",
      zh: "\u7279\u65af\u62c9\u7684\u601d\u8003\u65b9\u5f0f\u548c\u884c\u4e3a\u65b9\u5f0f\u7ed9\u6211\u5e26\u6765\u4e86\u6781\u5927\u7684\u9707\u648c\u548c\u542f\u53d1\uff0c\u56e0\u6b64\u770b\u5b8c\u8fd9\u672c\u4e66\u4e4b\u540e\u4ed6\u4e5f\u6210\u4e3a\u4e86\u6211\u7684\u7cbe\u795e\u5076\u50cf\u3002",
    },
    height: 648,
    rotate: -6,
    shift: 18,
    src: "/images/books/book-1.jpg",
    title: {
      en: "My Inventions",
      zh: "\u7279\u65af\u62c9\u81ea\u4f20",
    },
    width: 432,
  },
  {
    alt: "\u300a\u8ba4\u77e5\u89c9\u9192\u300b\u5c01\u9762",
    description: {
      en: "This book introduced me to metacognition for the first time. It taught me how to direct my own mind, understand myself more clearly, and stay lucid and efficient.",
      zh: "\u8fd9\u672c\u4e66\u8ba9\u6211\u7b2c\u4e00\u6b21\u4e86\u89e3\u4e86\u4ec0\u4e48\u662f\u5143\u8ba4\u77e5\uff0c\u4f7f\u6211\u5b66\u4f1a\u5982\u4f55\u638c\u63a7\u81ea\u5df1\u7684\u5927\u8111\uff0c\u4f7f\u6211\u66f4\u52a0\u4e86\u89e3\u81ea\u5df1\uff0c\u8ba9\u81ea\u5df1\u4fdd\u6301\u6e05\u9192\uff0c\u4fdd\u6301\u9ad8\u6548",
    },
    height: 1042,
    rotate: -3,
    shift: 34,
    src: "/images/books/book-2.jpg",
    title: {
      en: "Cognitive Awakening",
      zh: "\u8ba4\u77e5\u89c9\u9192",
    },
    width: 768,
  },
  {
    alt: "Cover of Poor Charlie's Almanack",
    description: {
      en: "Munger's wisdom is something I expect to study and practice over an entire lifetime.",
      zh: "\u8292\u683c\u7684\u667a\u6167\u503c\u5f97\u6211\u7528\u4e00\u751f\u53cd\u590d\u5b66\u4e60\u4e0e\u5b9e\u8df5",
    },
    height: 2005,
    rotate: 0,
    shift: 0,
    src: "/images/books/book-3.jpg",
    title: {
      en: "Poor Charlie's Almanack",
      zh: "\u7a77\u67e5\u7406\u5b9d\u5178",
    },
    width: 2071,
  },
  {
    alt: "\u300a\u4e09\u4f53\u300b\u5c01\u9762",
    description: {
      en: "I have read every word Liu Cixin has written. His work sparked my rational thinking and my curiosity about science, philosophy, and the nature of the world, and what he expresses has influenced me continuously from age thirteen until now.",
      zh: "\u5218\u6148\u6b23\u5199\u8fc7\u7684\u6bcf\u7bc7\u5c0f\u8bf4\u7684\u6bcf\u4e2a\u5b57\u6211\u90fd\u770b\u8fc7\uff0c\u4ed6\u7684\u4f5c\u54c1\u6fc0\u53d1\u4e86\u6211\u7684\u7406\u6027\u601d\u7ef4\u548c\u5bf9\u79d1\u5b66\uff0c\u54f2\u5b66\u4e0e\u4e16\u754c\u672c\u8d28\u7684\u597d\u5947\u5fc3\uff0c\u4ed6\u4f5c\u54c1\u4e2d\u6240\u8868\u8fbe\u7684\u4e1c\u897f\u4ece13\u5c81\u5230\u73b0\u5728\u4e00\u76f4\u5728\u5f71\u54cd\u6211",
    },
    height: 1569,
    rotate: 4,
    shift: 28,
    src: "/images/books/book-4.jpg",
    title: {
      en: "The Three-Body Problem",
      zh: "\u4e09\u4f53",
    },
    width: 1080,
  },
  {
    alt: "Cover of Meditations by Marcus Aurelius",
    description: {
      en: "The philosophy in this book taught me how to understand the relationship between myself and everything in the world, and helped me find inner calm.",
      zh: "\u4e66\u4e2d\u6240\u8868\u8fbe\u7684\u5904\u4e16\u54f2\u5b66\u8ba9\u6211\u5b66\u4f1a\u4e86\u5982\u4f55\u770b\u5f85\u81ea\u5df1\u4e0e\u4e16\u95f4\u4e07\u7269\u7684\u5173\u7cfb\uff0c\u4f7f\u6211\u5b9e\u73b0\u5185\u5fc3\u7684\u5e73\u9759",
    },
    height: 1413,
    rotate: 7,
    shift: 14,
    src: "/images/books/book-5.jpg",
    title: {
      en: "Meditations",
      zh: "\u6c89\u601d\u5f55",
    },
    width: 1000,
  },
] as const;

function getBookTransform(
  index: number,
  hoveredIndex: number | null,
  shift: number,
  rotate: number,
) {
  if (hoveredIndex === null) {
    return `translateX(0px) translateY(${shift}px) rotate(${rotate}deg) scale(1)`;
  }

  if (hoveredIndex === index) {
    const lifted = Math.max(shift - 34, -20);
    return `translateX(0px) translateY(${lifted}px) rotate(0deg) scale(1.15)`;
  }

  const direction = index < hoveredIndex ? -1 : 1;
  const distance = Math.abs(index - hoveredIndex);
  const moveX = distance === 1 ? 24 * direction : 14 * direction;
  const moveY = shift + (distance === 1 ? 8 : 4);
  const adjustedRotate = rotate + direction * (distance === 1 ? 4 : 2);
  const scale = distance === 1 ? 0.97 : 0.985;

  return `translateX(${moveX}px) translateY(${moveY}px) rotate(${adjustedRotate}deg) scale(${scale})`;
}

function getBookZIndex(index: number, hoveredIndex: number | null) {
  if (hoveredIndex === null) {
    return 10 + index;
  }

  if (hoveredIndex === index) {
    return 60;
  }

  const distance = Math.abs(index - hoveredIndex);
  return distance === 1 ? 34 : 18;
}

export default function ImpactBooksShelf({ lang }: ImpactBooksShelfProps) {
  const text = copy[lang];
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="impact-books-section" aria-label={text.title}>
      <header className="impact-books-header">
        <h2 className="impact-books-title">{text.title}</h2>
      </header>

      <div
        className="impact-books-rail"
        onPointerLeave={() => setHoveredIndex(null)}
      >
        <div className="impact-books-grid">
          {books.map((book, index) => {
            const isActive = hoveredIndex === index;
            const style = {
              "--book-rotate": `${book.rotate}deg`,
              "--book-shift": `${book.shift}px`,
              transform: getBookTransform(index, hoveredIndex, book.shift, book.rotate),
              zIndex: getBookZIndex(index, hoveredIndex),
            } as CSSProperties;

            return (
              <article
                key={book.src}
                className="impact-book-card"
                data-active={isActive}
                data-index={index + 1}
                style={style}
                onPointerEnter={() => setHoveredIndex(index)}
              >
                <div className="impact-book-cover-shell">
                  <Image
                    src={book.src}
                    alt={book.alt}
                    width={book.width}
                    height={book.height}
                    sizes="(max-width: 640px) 72vw, (max-width: 980px) 38vw, 18vw"
                    className="impact-book-cover"
                  />
                  <div className="impact-book-overlay">
                    <Image
                      src={book.src}
                      alt=""
                      aria-hidden="true"
                      width={book.width}
                      height={book.height}
                      sizes="(max-width: 640px) 72vw, (max-width: 980px) 38vw, 18vw"
                      className="impact-book-overlay-blur"
                    />
                    <div className="impact-book-note-copy">
                      <h3 className="impact-book-name">{book.title[lang]}</h3>
                      <p className="impact-book-description">{book.description[lang]}</p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
