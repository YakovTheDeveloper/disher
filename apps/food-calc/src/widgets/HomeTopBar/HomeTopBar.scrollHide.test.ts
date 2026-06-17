import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

// Инвариант scroll-hide бара (см. critique 2026-06-14): `data-topbar-hide`
// прячет аккаунт/нутриенты/дату, но НИКОГДА кнопку «Назад» (она без класса,
// рендерится сырым `{backSlot}` — выход со страницы должен всегда оставаться).
// Правило живёт в чистом CSS → typecheck/рантайм-тесты его не ловят. Этот тест
// читает исходный .scss и проверяет, какие пилюли реально targeted'ятся в
// hide-правилах. Любой будущий рефактор, добавивший `.backSlot` (или потерявший
// центр/дату), уронит точные set-сравнения ниже.

const scss = readFileSync(
  fileURLToPath(new URL('./HomeTopBar.module.scss', import.meta.url)),
  'utf8',
);

// Захватываем `(state, targetClass)` из каждого селектора вида
// `.shell[data-topbar-hide='<state>'] .<targetClass>`.
const HIDE_RULE = /\.shell\[data-topbar-hide='(settings|all)'\]\s+\.([A-Za-z0-9_]+)/g;
const targets = [...scss.matchAll(HIDE_RULE)].map((m) => ({ state: m[1], cls: m[2] }));

describe('HomeTopBar scroll-hide CSS invariant', () => {
  it('hide-правила вообще есть', () => {
    expect(targets.length).toBeGreaterThan(0);
  });

  it('targeted только аккаунт / центр / дата — ничего лишнего', () => {
    for (const t of targets) {
      expect(['accountSlot', 'centerSlot', 'dateSegment']).toContain(t.cls);
    }
  });

  it("'settings' прячет ТОЛЬКО пилюлю аккаунта", () => {
    const settings = targets.filter((t) => t.state === 'settings').map((t) => t.cls);
    expect(settings).toEqual(['accountSlot']);
  });

  it("'all' прячет аккаунт + нутриенты (центр) + дату, и только их (backSlot не тронут)", () => {
    const all = new Set(targets.filter((t) => t.state === 'all').map((t) => t.cls));
    expect(all).toEqual(new Set(['accountSlot', 'centerSlot', 'dateSegment']));
  });
});
