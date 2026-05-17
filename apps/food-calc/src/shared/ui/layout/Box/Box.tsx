import type { CSSProperties, ElementType, HTMLAttributes, Ref } from 'react';
import { type Space, spaceVar } from '../space';

export type BoxProps = HTMLAttributes<HTMLElement> & {
  /** DOM tag to render. Defaults to `div`. */
  as?: ElementType;
  ref?: Ref<HTMLElement>;
  /** Padding on all sides — a step on the `--space-*` scale. */
  p?: Space;
  /** Horizontal padding (left + right). Overrides `p`. */
  px?: Space;
  /** Vertical padding (top + bottom). Overrides `p`. */
  py?: Space;
  /** Per-side padding. Overrides `px` / `py` / `p`. */
  pt?: Space;
  pr?: Space;
  pb?: Space;
  pl?: Space;
};

/**
 * Box — the base layout primitive. A plain element whose padding is locked
 * to the `--space-*` token scale; it has no visual styling of its own.
 * `Stack` and `Inline` build on it. Reach for `Box` directly only when you
 * need raw token padding without a flex context.
 */
const Box = ({ as, ref, p, px, py, pt, pr, pb, pl, style, ...rest }: BoxProps) => {
  const Tag = (as ?? 'div') as ElementType;
  const padding: CSSProperties = {
    paddingTop: spaceVar(pt ?? py ?? p),
    paddingRight: spaceVar(pr ?? px ?? p),
    paddingBottom: spaceVar(pb ?? py ?? p),
    paddingLeft: spaceVar(pl ?? px ?? p),
  };
  // Caller `style` wins, so a one-off override is still possible.
  return <Tag ref={ref} style={{ boxSizing: 'border-box', ...padding, ...style }} {...rest} />;
};

export default Box;
