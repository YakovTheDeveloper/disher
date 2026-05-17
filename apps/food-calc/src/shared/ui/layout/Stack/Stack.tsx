import type { CSSProperties } from 'react';
import Box, { type BoxProps } from '../Box/Box';
import { type Space, spaceVar } from '../space';

const ALIGN = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
} as const;

const JUSTIFY = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
} as const;

export type StackProps = BoxProps & {
  /** Main-axis direction. Defaults to `column` (a vertical stack). */
  direction?: 'row' | 'column';
  /** Gap between children — a step on the `--space-*` scale. */
  gap?: Space;
  /** Cross-axis alignment (`align-items`). */
  align?: keyof typeof ALIGN;
  /** Main-axis distribution (`justify-content`). */
  justify?: keyof typeof JUSTIFY;
  /** Allow children to wrap onto multiple lines. */
  wrap?: boolean;
};

/**
 * Stack — a flex container with token-scale `gap`. Vertical by default.
 * Replaces hand-written `display:flex; flex-direction; gap` blocks in
 * `.module.scss`, so spacing always comes from the `--space-*` scale.
 */
const Stack = ({ direction = 'column', gap, align, justify, wrap, style, ...box }: StackProps) => {
  const flex: CSSProperties = {
    display: 'flex',
    flexDirection: direction,
    gap: spaceVar(gap),
    alignItems: align && ALIGN[align],
    justifyContent: justify && JUSTIFY[justify],
    flexWrap: wrap ? 'wrap' : undefined,
    // Lets a nested Stack shrink instead of overflowing its parent — the
    // classic flexbox truncation fix, applied once here for every consumer.
    minWidth: 0,
  };
  return <Box style={{ ...flex, ...style }} {...box} />;
};

export default Stack;
