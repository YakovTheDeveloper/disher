import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useTopBarScrollHideController } from './topBarScrollHide';

// Контроллер scroll-hide бара: пишет `data-topbar-hide` в DOM-узел `.shell`
// императивно (без setState). Тестируем сам контракт записи/снятия атрибута и
// стабильность идентичности `setHide` — ту часть, что typecheck не ловит.

describe('useTopBarScrollHideController', () => {
  it('пишет состояние в data-topbar-hide на shell-элементе', () => {
    const { result } = renderHook(() => useTopBarScrollHideController());
    const el = document.createElement('div');
    result.current.shellRef.current = el;

    result.current.setHide('all');
    expect(el.dataset.topbarHide).toBe('all');

    result.current.setHide('settings');
    expect(el.dataset.topbarHide).toBe('settings');
  });

  it("'none' снимает атрибут (бар снова виден)", () => {
    const { result } = renderHook(() => useTopBarScrollHideController());
    const el = document.createElement('div');
    result.current.shellRef.current = el;

    result.current.setHide('all');
    expect(el.dataset.topbarHide).toBe('all');

    result.current.setHide('none');
    expect(el.dataset.topbarHide).toBeUndefined();
  });

  it('повторная запись того же значения не падает (дедуп-ветка)', () => {
    const { result } = renderHook(() => useTopBarScrollHideController());
    const el = document.createElement('div');
    result.current.shellRef.current = el;

    result.current.setHide('all');
    result.current.setHide('all');
    expect(el.dataset.topbarHide).toBe('all');
  });

  it('no-op без shell-элемента (эффект Screen вне провайдера/до маунта)', () => {
    const { result } = renderHook(() => useTopBarScrollHideController());
    expect(() => result.current.setHide('all')).not.toThrow();
  });

  it('setHide стабилен между рендерами (эффект Screen не переподписывается)', () => {
    const { result, rerender } = renderHook(() => useTopBarScrollHideController());
    const first = result.current.setHide;
    rerender();
    expect(result.current.setHide).toBe(first);
  });
});
