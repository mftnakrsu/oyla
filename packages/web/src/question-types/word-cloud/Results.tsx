import cloud from 'd3-cloud';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { EmptyResults } from '../shared';
import type { ResultsProps } from '../types';
import { type Orientation, orientationOf, sizeOf, type Tier, tierOf } from './layout';

interface CloudWord extends cloud.Word {
  text: string;
  size: number;
  tier: Tier;
  orientation: Orientation;
}

interface PlacedWord {
  text: string;
  size: number;
  x: number;
  y: number;
  tier: Tier;
  orientation: Orientation;
}

const FONT = '"Atkinson Hyperlegible Next Variable", system-ui, sans-serif';
const MAX_LAYOUT_ATTEMPTS = 6;
const tierClass = { 1: 'fill-cloud-1', 2: 'fill-cloud-2', 3: 'fill-cloud-3' } as const;
const tierTextClass = { 1: 'text-cloud-1', 2: 'text-cloud-2', 3: 'text-cloud-3' } as const;

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

/**
 * Word size and colour tier both follow how many people gave the word; some words read
 * vertically, like a classic word cloud (see layout.ts).
 */
export function WordCloudResults({ results }: ResultsProps<'word-cloud'>) {
  const { tn } = useI18n();
  const [ref, { width, height }] = useSize<HTMLDivElement>();
  const [placed, setPlaced] = useState<PlacedWord[] | null>(null);
  const max = results.words[0]?.count ?? 1;

  useEffect(() => {
    if (width === 0 || height === 0 || results.words.length === 0) {
      setPlaced([]);
      return;
    }
    const top = results.words[0]?.count ?? 1;
    let layout: ReturnType<typeof cloud<CloudWord>> | undefined;
    let cancelled = false;

    // d3-cloud silently drops words that do not fit, so shrink and retry until all of them do.
    const run = (attempt: number) => {
      const largest = Math.min(height / 3.2, width / 6) * 0.85 ** attempt;
      const smallest = Math.max(14, largest / 6);
      const words: CloudWord[] = results.words.map((word, rank) => ({
        text: word.text,
        size: sizeOf(word.count, top, smallest, largest),
        tier: tierOf(word.count, top),
        orientation: orientationOf(word.text, rank),
      }));
      layout = cloud<CloudWord>()
        .size([width, height])
        .words(words)
        .padding(Math.max(3, smallest / 5))
        .rotate((d) => d.orientation)
        .font(FONT)
        .fontWeight(800)
        .fontSize((d) => d.size)
        .spiral('archimedean')
        .random(() => 0.5)
        .on('end', (output) => {
          if (cancelled) return;
          if (output.length < words.length && attempt + 1 < MAX_LAYOUT_ATTEMPTS) {
            run(attempt + 1);
            return;
          }
          setPlaced(
            output.map((w) => ({
              text: w.text,
              size: w.size,
              x: w.x ?? 0,
              y: w.y ?? 0,
              tier: w.tier,
              orientation: w.orientation,
            })),
          );
        });
      layout.start();
    };

    try {
      run(0);
    } catch {
      setPlaced(null); // no canvas (tests, very old browsers): use the plain list below
    }
    return () => {
      cancelled = true;
      layout?.stop();
    };
  }, [results, width, height]);

  if (results.words.length === 0) {
    return (
      <div ref={ref} className="h-full min-h-[12em]">
        <EmptyResults />
      </div>
    );
  }

  return (
    <div ref={ref} className="relative h-full min-h-[12em] w-full">
      {placed === null ? (
        <ul className="flex flex-wrap items-baseline justify-center gap-x-[0.8em] gap-y-[0.3em]">
          {results.words.map((word) => (
            <li
              key={word.text}
              className={`font-extrabold ${tierTextClass[tierOf(word.count, max)]}`}
              style={{ fontSize: `${1 + Math.min(word.count, 6) * 0.35}em` }}
            >
              {word.text}
            </li>
          ))}
        </ul>
      ) : (
        <svg
          width={width}
          height={height}
          viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
          aria-hidden="true"
        >
          {placed.map((word) => (
            <text
              key={word.text}
              textAnchor="middle"
              className={`${tierClass[word.tier]} transition-transform duration-500 ease-out`}
              style={{
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: word.size,
                transform: `translate(${word.x}px, ${word.y}px) rotate(${word.orientation}deg)`,
              }}
            >
              {word.text}
            </text>
          ))}
        </svg>
      )}
      <ul className="sr-only">
        {results.words.map((word) => (
          <li key={word.text}>
            {word.text}: {tn('results.answers', word.count)}
          </li>
        ))}
      </ul>
    </div>
  );
}
