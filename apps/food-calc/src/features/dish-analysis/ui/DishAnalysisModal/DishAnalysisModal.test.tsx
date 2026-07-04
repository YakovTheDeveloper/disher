import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Мутабельные держатели для моков (vi.mock фабрики хойстятся — читают из h).
const h = vi.hoisted(() => ({
  run: undefined as { status: string; error?: string; result?: unknown } | undefined,
  persisted: null as { dishId: string; summary: string; insights: unknown[]; createdAt: string } | null,
  online: true,
  start: undefined as ReturnType<typeof vi.fn> | undefined,
  clear: undefined as ReturnType<typeof vi.fn> | undefined,
}));

vi.mock('../../api/queries', () => ({
  useDishAnalysis: () => ({ data: h.persisted, isLoading: false }),
}));
vi.mock('@/shared/lib/hooks/useOnline', () => ({ useOnline: () => h.online }));
vi.mock('../../model/runStore', () => ({
  useDishRun: () => h.run,
  useDishRunStore: (sel: (s: { start: unknown; clear: unknown }) => unknown) =>
    sel({ start: h.start, clear: h.clear }),
}));
vi.mock('../../api/storage', () => ({ deleteDishAnalysis: vi.fn().mockResolvedValue(undefined) }));

// Лёгкие заглушки тяжёлых детей — тест про ветвление рендера, не про их вёрстку.
vi.mock('@/features/analysis/AnalysisResult', () => ({
  AnalysisResult: () => <div data-testid="analysis-result" />,
}));
vi.mock('@/features/analysis/FabricLoader', () => ({
  FabricLoader: ({ caption }: { caption?: string }) => <div data-testid="loader">{caption}</div>,
}));
vi.mock('@/shared/ui/ModalLayout', () => ({
  ModalLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/shared/ui/ModalShell', () => {
  const ModalShell = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const Header = ({ trailing }: { trailing?: React.ReactNode }) => <div>{trailing}</div>;
  Header.displayName = 'ModalShellHeader';
  const Body = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  Body.displayName = 'ModalShellBody';
  ModalShell.Header = Header;
  ModalShell.Body = Body;
  return { ModalShell };
});
vi.mock('@/shared/ui/ModalHeader', () => ({
  HeaderDeleteButton: ({ label, onClick }: { label?: string; onClick?: () => void }) => (
    <button onClick={onClick}>{label}</button>
  ),
}));
vi.mock('@/shared/ui/atoms/Button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));
vi.mock('@/shared/ui/atoms/Typography', () => ({
  Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}));

import DishAnalysisModal from './DishAnalysisModal';

const CONTENT = { dishId: 'd1', summary: 'Готовый разбор блюда', insights: [], createdAt: '' };

beforeEach(() => {
  h.run = undefined;
  h.persisted = null;
  h.online = true;
  h.start = vi.fn();
  h.clear = vi.fn();
});

describe('DishAnalysisModal — error не прячет существующий разбор (регресс 2026-07-04)', () => {
  it('провал «Перезапустить» при существующем разборе: контент виден, ошибка инлайном, НЕ полноэкранная', () => {
    h.persisted = CONTENT;
    h.run = { status: 'error', error: 'Недостаточно средств' };

    render(<DishAnalysisModal dishId="d1" hasIngredients onClose={() => {}} />);

    // Готовый разбор остаётся на экране...
    expect(screen.getByTestId('analysis-result')).toBeInTheDocument();
    // ...ошибка показана инлайном...
    expect(screen.getByText('Недостаточно средств')).toBeInTheDocument();
    // ...и это ветка контента (кнопка «Перезапустить разбор»), а НЕ полноэкранная
    // ошибка (у той кнопка «Повторить»).
    expect(screen.getByRole('button', { name: 'Перезапустить разбор' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Повторить' })).toBeNull();
  });

  it('ошибка первого запуска без контента: полноэкранное состояние + «Повторить»', () => {
    h.persisted = null;
    h.run = { status: 'error', error: 'Сеть недоступна' };

    render(<DishAnalysisModal dishId="d1" hasIngredients onClose={() => {}} />);

    expect(screen.queryByTestId('analysis-result')).toBeNull();
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Перезапустить разбор' })).toBeNull();
  });
});
