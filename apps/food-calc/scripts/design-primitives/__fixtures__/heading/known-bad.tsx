// FIXTURE — raw heading tags carrying text. detect --category=heading MUST find
// these (h1/h2/h3). Not a real component; `s` is a stub so it type-shapes.
const s: Record<string, string> = {};

const Bad = ({ name }: { name: string }) => (
  <header className={s.h}>
    <h1 className={s.screen}>Заголовок</h1>
    <h2>{name}</h2>
    <h3 className={s.card}>Карточка</h3>
  </header>
);

export default Bad;
