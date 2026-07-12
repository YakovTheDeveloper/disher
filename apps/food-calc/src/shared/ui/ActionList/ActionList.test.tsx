import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ActionList } from './ActionList';

describe('ActionList', () => {
  // Контракт композита: секция рендерит свой заголовок (Text role="label") и детей.
  // Владение зазором — на sys-токенах в scss (не тестируем px), тут ловим, что
  // структура «label + content» доходит до DOM.
  it('renders a labeled section with its content', () => {
    render(
      <ActionList>
        <ActionList.Section label="Данные">
          <button>Скачать</button>
          <button>Загрузить</button>
        </ActionList.Section>
      </ActionList>,
    );
    expect(screen.getByText('Данные')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Скачать' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Загрузить' })).toBeInTheDocument();
  });

  // Безымянная секция — валидна (не всякая секция имеет подпись); label не течёт.
  it('renders an unlabeled section without a stray label node', () => {
    const { container } = render(
      <ActionList>
        <ActionList.Section>
          <button>Действие</button>
        </ActionList.Section>
      </ActionList>,
    );
    expect(screen.getByRole('button', { name: 'Действие' })).toBeInTheDocument();
    expect(container.querySelector('label')).toBeNull();
  });

  // Уровень заголовка настраивается (h2 корень / h3 под-экран) для корректного
  // document outline. Ловит регресс, если `as` перестанет доходить до тега.
  it('honors the heading level via the `as` prop', () => {
    render(
      <ActionList>
        <ActionList.Section label="Обои" as="h3">
          <div>picker</div>
        </ActionList.Section>
      </ActionList>,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Обои' })).toBeInTheDocument();
  });

  // Контент секции — ЛЮБЫЕ объекты, не только ряды: высокий контрол кладётся
  // напрямую, зазор «заголовок → контрол» несёт сама секция.
  it('accepts arbitrary section content', () => {
    render(
      <ActionList>
        <ActionList.Section label="Цвет карточек">
          <input aria-label="палитра" />
        </ActionList.Section>
      </ActionList>,
    );
    expect(screen.getByLabelText('палитра')).toBeInTheDocument();
  });
});
