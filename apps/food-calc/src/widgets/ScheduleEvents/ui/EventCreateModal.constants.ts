// Главный инпут ОФЛАЙН-модалки события — медаль-печать «Вручную» (`<label htmlFor>`)
// делегирует фокус сюда, это же триггерит раскрытие модалки через onFocusCapture.
export const EVENT_CREATE_MAIN_INPUT_ID = 'event-create-main';

// Инпут ОНЛАЙН-бара события — free-text для LLM-разбора (см. useWriteEventFlow).
// Отдельный id: фокус сюда НЕ открывает офлайн-модалку.
export const EVENT_WRITE_INPUT_ID = 'event-write-online';

// Ровно 4 аспекта, фиксировано (решение 2026-07-15). Поля пустые; плейсхолдер —
// лишь пример, канон label не навязываем (см. tds/event-tracking-simplification-plan.md).
export const ASPECT_COUNT = 4;

export const ASPECT_PLACEHOLDERS = [
  'напр. Настроение',
  'напр. Энергия',
  'напр. Тревога',
  'напр. Сон',
] as const;
