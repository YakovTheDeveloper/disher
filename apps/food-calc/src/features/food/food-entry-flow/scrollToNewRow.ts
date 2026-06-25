// Подскролл к только что добавленной строке списка — еде в расписании ИЛИ
// ингредиенту блюда. Обе строки несут `data-row-id` (LongPressRow прокидывает
// любые `data-*` на сам `<li>`). Двойной кадр + небольшой таймаут ждут, пока
// `useLiveQuery` дорисует новую строку в DOM после фоновой мутации.
export function scrollToNewRow(id: string): void {
  requestAnimationFrame(() => {
    setTimeout(() => {
      const el = document.querySelector(`[data-row-id="${CSS.escape(id)}"]`);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 150);
  });
}
