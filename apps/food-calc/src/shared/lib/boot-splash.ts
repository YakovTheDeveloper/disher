// Снимает статичный boot-splash из index.html. Сплэш живёт СОСЕДОМ #root (не
// внутри) — иначе первый же createRoot().render() вычистил бы его ещё до того,
// как AuthGate/BackupGate решатся, и стартовая белизна вернулась бы. Поэтому
// прячем его императивно из React — в момент, когда появляется ПЕРВЫЙ реальный
// экран (AuthScreen для незалогиненного / BackupGate-ready для залогиненного).
let hidden = false;

export function hideBootSplash(): void {
  if (hidden) return;
  hidden = true;
  const el = document.getElementById('boot-splash');
  if (!el) return;
  el.classList.add('boot-splash--hidden');
  const remove = () => el.remove();
  el.addEventListener('transitionend', remove, { once: true });
  // Предохранитель: если transitionend не прилетит (вкладка в фоне, reduced-
  // motion без перехода) — всё равно снять узел после длительности перехода.
  window.setTimeout(remove, 400);
}
