export const normalizeTime = (h: string, m: string) => {
  const hNum = h === '' ? 0 : Math.max(0, Math.min(23, Number(h)));
  const mNum = m === '' ? 0 : Math.max(0, Math.min(59, Number(m)));
  return `${String(hNum).padStart(2, '0')}:${String(mNum).padStart(2, '0')}`;
};
