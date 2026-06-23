// FIXTURE — raw text tags carrying text. detect --category=text MUST find these
// (two <p> + one text-bearing <span>).
const s: Record<string, string> = {};

const Bad = ({ detail }: { detail: string }) => (
  <div className={s.box}>
    <p className={s.detail}>{detail}</p>
    <span className={s.tag}>метка</span>
    <p>Просто текст</p>
  </div>
);

export default Bad;
