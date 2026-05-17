import Stack, { type StackProps } from '../Stack/Stack';

/** `Inline` owns its direction; everything else is inherited from `Stack`. */
export type InlineProps = Omit<StackProps, 'direction'>;

/**
 * Inline — a horizontal `Stack`. Lays children in a row, wrapping by
 * default and vertically centered. Use for chip rows, button groups, and
 * label + value pairs.
 */
const Inline = ({ align = 'center', wrap = true, ...rest }: InlineProps) => (
  <Stack direction="row" align={align} wrap={wrap} {...rest} />
);

export default Inline;
