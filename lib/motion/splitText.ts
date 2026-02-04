import { createElement, type ReactNode } from 'react';

type SplitMode = 'words' | 'chars';

type SplitTextOptions = {
	mode?: SplitMode;
	outerClassName?: string;
	innerClassName?: string;
	tokenDataAttr?: string;
};

// Splits text into span wrappers for motion-safe reveals; keeps spaces intact for screen readers.
export function splitText(
	text: string,
	{
		mode = 'words',
		outerClassName = 'inline-block overflow-hidden align-top',
		innerClassName = 'inline-block will-change-transform will-change-[filter] will-change-opacity',
		tokenDataAttr = 'data-split',
	}: SplitTextOptions = {}
): ReactNode[] {
	const normalized = text.replace(/\s+/g, ' ').trim();
	if (!normalized) return [];

	const spaceNode = (key: string) =>
		createElement('span', { key, 'aria-hidden': true }, '\u00A0');

	if (mode === 'chars') {
		return Array.from(normalized).map((ch, index) => {
			if (ch === ' ') return spaceNode(`space-${index}`);

			return createElement(
				'span',
				{ key: `char-outer-${index}`, className: outerClassName },
				createElement(
					'span',
					{ [tokenDataAttr]: 'char', className: innerClassName, 'aria-hidden': true } as Record<string, unknown>,
					ch
				)
			);
		});
	}

	const words = normalized.split(' ');

	return words.flatMap((word, index) => {
		const nodes: ReactNode[] = [
			createElement(
				'span',
				{ key: `word-outer-${index}`, className: outerClassName },
				createElement(
					'span',
					{ [tokenDataAttr]: 'word', className: innerClassName } as Record<string, unknown>,
					word
				)
			),
		];

		if (index !== words.length - 1) nodes.push(spaceNode(`space-${index}`));
		return nodes;
	});
}
