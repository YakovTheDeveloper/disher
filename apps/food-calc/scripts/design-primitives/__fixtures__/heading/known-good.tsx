// FIXTURE — the same headings already via the primitive. detect --category=heading
// MUST return 0 (the <Heading> component is not a raw host tag).
import { Heading } from '@/shared/ui/atoms/Typography';

const s: Record<string, string> = {};

const Good = ({ name }: { name: string }) => (
  <header className={s.h}>
    <Heading size="screen">Заголовок</Heading>
    <Heading as="h3" size="card">{name}</Heading>
  </header>
);

export default Good;
