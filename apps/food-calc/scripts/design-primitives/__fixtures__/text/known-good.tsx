// FIXTURE — detect --category=text MUST return 0. Covers the two span
// false-positive guards: an icon-wrapper span (element-only child) and a comment
// placeholder span (empty expression) are NOT text and must not be flagged.
import { Text } from '@/shared/ui/atoms/Typography';
import Icon from './icon.svg?react';

const s: Record<string, string> = {};

const Good = ({ detail }: { detail: string }) => (
  <div className={s.box}>
    <Text role="body" className={s.detail}>{detail}</Text>
    <span className={s.iconWrap} aria-hidden>
      <Icon />
    </span>
    <span>{/* placeholder */}</span>
  </div>
);

export default Good;
