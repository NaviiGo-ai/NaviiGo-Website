import type { ReactNode } from 'react';

type SplitMode = 'words' | 'chars';

export function splitText(
  text: string,
  {
    mode = 'words',
    outerClassName = 'inline-block overflow-hidden align-top',
    innerClassName =
      'inline-block will-change-transform will-change-[filter] will-change-opacity',
    tokenDataAttr = 'data-split',
  }: {
    mode?: SplitMode;
    outerClassName?: string;
    innerClassName?: string;
    tokenDataAttr?: string;
  } = {}
): ReactNode[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  if (mode === 'chars') {
    return Array.from(normalized).map((ch, index) => {
      if (ch === ' ') {
        return (
          <span key={`space-${index}`} aria-hidden="true">
            {'\u00A0'}
          </span>
        );
      }

      return (
        <span key={`char-outer-${index}`} className={outerClassName}>
          <span
            {...{ [tokenDataAttr]: 'char' }}
            className={innerClassName}
            aria-hidden="true"
          >
            {ch}
          </span>
        </span>
      );
    });
  }

  const words = normalized.split(' ');

  return words.flatMap((word, index) => {
    const nodes: ReactNode[] = [
      <span key={`word-outer-${index}`} className={outerClassName}>
        <span {...{ [tokenDataAttr]: 'word' }} className={innerClassName}>
          {word}
        </span>
      </span>,
    ];

    if (index !== words.length - 1) {
      nodes.push(
        <span key={`space-${index}`} aria-hidden="true">
          {'\u00A0'}
        </span>
      );
    }

    return nodes;
  });
}
