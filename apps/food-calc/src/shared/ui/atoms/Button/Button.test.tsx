import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import Button from './Button';

// Контракт disabled/loading + проброс пропсов. Тесты поведенческие (атрибуты,
// onClick, aria) — не зависят от того, как vite мокает CSS-module классы.
describe('Button — disabled / loading contract', () => {
  describe('as="button"', () => {
    it('isLoading выставляет disabled даже при явном disabled={false} (override-фикс)', () => {
      // Регресс-страж: `disabled=` объявлен до `{...props}`, а `disabled`
      // деструктурирован — спред больше не может вернуть атрибут в false.
      render(
        <Button isLoading disabled={false}>
          Сохранить
        </Button>
      );
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('disabled-проп выставляет атрибут (не затирается спредом)', () => {
      render(<Button disabled>Сохранить</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('без disabled/isLoading кнопка активна', () => {
      render(<Button>Сохранить</Button>);
      expect(screen.getByRole('button')).toBeEnabled();
    });

    it('onClick срабатывает на активной кнопке', () => {
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Сохранить</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('as="label" (ModalByLabel)', () => {
    it('активный label делегирует фокус (htmlFor) и зовёт onClick', () => {
      const onClick = vi.fn();
      render(
        <Button as="label" htmlFor="target-input" onClick={onClick}>
          Блюдо
        </Button>
      );
      const label = screen.getByText('Блюдо').closest('label');
      expect(label).toHaveAttribute('for', 'target-input');
      fireEvent.click(label!);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('disabled label НЕ зовёт onClick и снимает htmlFor', () => {
      const onClick = vi.fn();
      render(
        <Button as="label" htmlFor="target-input" disabled onClick={onClick}>
          Блюдо
        </Button>
      );
      const label = screen.getByText('Блюдо').closest('label');
      expect(label).not.toHaveAttribute('for');
      fireEvent.click(label!);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('пробрасывает aria-label / data-* на <label> (не теряются)', () => {
      render(
        <Button
          as="label"
          htmlFor="target-input"
          aria-label="Создать блюдо"
          data-testid="dish-label"
        >
          Блюдо
        </Button>
      );
      const label = screen.getByTestId('dish-label');
      expect(label.tagName).toBe('LABEL');
      expect(label).toHaveAttribute('aria-label', 'Создать блюдо');
    });
  });
});
