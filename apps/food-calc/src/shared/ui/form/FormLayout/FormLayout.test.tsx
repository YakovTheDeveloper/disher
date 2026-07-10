import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { FormLayout } from './FormLayout';

describe('FormLayout', () => {
  // Контракт композита: группа рендерит свой заголовок (FieldLabel) и детей.
  // Владение зазором — на sys-токенах в scss (не тестируем px), тут ловим, что
  // структура «label + content» доходит до DOM.
  it('renders a labeled group with its children', () => {
    render(
      <FormLayout>
        <FormLayout.Group label="Габариты">
          <input aria-label="вес" />
          <input aria-label="рост" />
        </FormLayout.Group>
      </FormLayout>,
    );
    expect(screen.getByText('Габариты')).toBeInTheDocument();
    expect(screen.getByLabelText('вес')).toBeInTheDocument();
    expect(screen.getByLabelText('рост')).toBeInTheDocument();
  });

  // Безымянная группа — валидна (не всякая группа имеет подпись); label не течёт.
  it('renders an unlabeled group without a stray label node', () => {
    const { container } = render(
      <FormLayout>
        <FormLayout.Group>
          <input aria-label="имя" />
        </FormLayout.Group>
      </FormLayout>,
    );
    expect(screen.getByLabelText('имя')).toBeInTheDocument();
    expect(container.querySelector('label')).toBeNull();
  });

  // Каптион = интро, ПРИНАДЛЕЖАЩЕЕ форме: рендерится как отдельный узел (не
  // «съедается» группой) над группами. Тесный зазор до первой группы владеет
  // контейнер (owl в scss) — тут ловим, что текст доходит до DOM.
  it('renders an intro caption above the groups', () => {
    render(
      <FormLayout>
        <FormLayout.Caption>Несколько ответов — и норма посчитается.</FormLayout.Caption>
        <FormLayout.Group label="Пол">
          <input aria-label="пол" />
        </FormLayout.Group>
      </FormLayout>,
    );
    expect(screen.getByText('Несколько ответов — и норма посчитается.')).toBeInTheDocument();
    expect(screen.getByLabelText('пол')).toBeInTheDocument();
  });

  // htmlFor превращает заголовок группы в семантический <label for>, связанный
  // с инпутом (клик по подписи → фокус). Ловит регресс, если htmlFor отвалится.
  it('ties the group label to an input via htmlFor', () => {
    render(
      <FormLayout>
        <FormLayout.Group label="Количество" htmlFor="qty">
          <input id="qty" />
        </FormLayout.Group>
      </FormLayout>,
    );
    expect(screen.getByLabelText('Количество')).toBe(document.getElementById('qty'));
  });
});
