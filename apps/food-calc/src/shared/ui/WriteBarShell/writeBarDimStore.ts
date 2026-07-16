// Приглушение плавающего chrome (HomeTopBar) на активном write-баре.
//
// Сигнал — атрибут `body[data-writebar-dim]`, который читает CSS хрома напрямую
// (см. HomeTopBar.module.scss) — React в диме не участвует. Раньше атрибут писали
// ВСЕ смонтированные `WriteBarShell` разом (еда + события — оба слайда Embla в DOM
// одновременно) как булев: последний-писатель-побеждает + cleanup удалял безусловно
// → без счётчика два перекрывшихся дима рассинхронивали флаг (chrome залипал).
//
// Здесь — refcount на модульном счётчике (тот же приём, что body-scroll-lock):
// атрибут ставится на переходе 0→1 и снимается на 1→0, поэтому конкурентные
// acquire/release больше не затирают друг друга. acquire/release строго парны
// (эффект + cleanup в WriteBarShell).
let count = 0;

export const writeBarDim = {
  acquire() {
    if (++count === 1) document.body.dataset.writebarDim = 'true';
  },
  release() {
    if (count > 0 && --count === 0) delete document.body.dataset.writebarDim;
  },
};
