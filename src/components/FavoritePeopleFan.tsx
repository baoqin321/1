"use client";

import Image from "next/image";
import { useState } from "react";
import { useLang } from "@/lib/context";

const copy = {
  zh: {
    title: "\u6211\u6700\u559c\u6b22\u7684\u4eba\u7269",
  },
  en: {
    title: "My Favorite People",
  },
} as const;

const favoritePeople = [
  {
    src: "/images/favorite-people/person-1.jpg",
    alt: "Favorite person 1",
  },
  {
    src: "/images/favorite-people/person-2.jpg",
    alt: "Favorite person 2",
  },
  {
    src: "/images/favorite-people/person-3.jpg",
    alt: "Favorite person 3",
  },
  {
    src: "/images/favorite-people/person-4.jpg",
    alt: "Favorite person 4",
  },
  {
    src: "/images/favorite-people/person-5.jpg",
    alt: "Favorite person 5",
  },
] as const;

const restingCards = [
  { x: -196, y: 28, rotate: -16 },
  { x: -96, y: 3, rotate: -8 },
  { x: 0, y: -8, rotate: 0 },
  { x: 96, y: 3, rotate: 8 },
  { x: 196, y: 28, rotate: 16 },
] as const;

function getCardTransform(index: number, hoveredIndex: number | null) {
  const card = restingCards[index];

  if (hoveredIndex === null) {
    return `translate(-50%, -50%) translate(${card.x}px, ${card.y}px) rotate(${card.rotate}deg) scale(1)`;
  }

  if (hoveredIndex === index) {
    return `translate(-50%, -50%) translate(${card.x * 0.22}px, ${card.y - 24}px) rotate(0deg) scale(1.12)`;
  }

  const direction = index < hoveredIndex ? -1 : 1;
  const distance = 72 + Math.abs(index - hoveredIndex) * 34;
  const x = card.x + direction * distance;
  const y = card.y + 30;
  const rotate = card.rotate + direction * 4;

  return `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotate}deg) scale(0.94)`;
}

export default function FavoritePeopleFan() {
  const lang = useLang();
  const text = copy[lang];
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Set<number>>(() => new Set());

  function activateCard(index: number) {
    setHoveredIndex((current) => (current === index ? current : index));
  }

  return (
    <section className="favorite-people-section" aria-label={text.title}>
      <div
        className="favorite-fan"
        onMouseLeave={() => setHoveredIndex(null)}
        onPointerLeave={() => setHoveredIndex(null)}
      >
        {favoritePeople.map((person, index) => {
          const isActive = hoveredIndex === index;
          const hasFailed = failedImages.has(index);

          return (
            <button
              key={person.src}
              type="button"
              className="favorite-person-card"
              data-active={isActive}
              style={{
                transform: getCardTransform(index, hoveredIndex),
                zIndex: isActive ? 50 : 10 + index,
              }}
              onMouseEnter={() => activateCard(index)}
              onPointerEnter={() => activateCard(index)}
              onPointerMove={() => activateCard(index)}
              onFocus={() => activateCard(index)}
              onBlur={() => setHoveredIndex(null)}
              onPointerDown={() => activateCard(index)}
              aria-pressed={isActive}
              aria-label={person.alt}
            >
              <span className="favorite-person-frame">
                {hasFailed ? (
                  <span className="favorite-person-placeholder">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                ) : (
                  <Image
                    src={person.src}
                    alt={person.alt}
                    fill
                    sizes="(max-width: 768px) 70vw, 32vw"
                    className="favorite-person-image"
                    onError={() => {
                      setFailedImages((current) => {
                        const next = new Set(current);
                        next.add(index);
                        return next;
                      });
                    }}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>

      <p className="favorite-people-caption">{text.title}</p>
    </section>
  );
}
