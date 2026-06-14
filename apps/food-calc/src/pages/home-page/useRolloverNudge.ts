import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { RouterUrls } from '@/app/router';
import toaster from '@/shared/lib/toaster/toaster';

// Формат ключа даты в роуте `/schedule/:id`. Дублирует литерал из router.tsx
// (index-редирект тоже строит дату через `format(new Date(), 'dd-MM-yyyy')`),
// держим локально, чтобы не тянуть страницу в зависимость от feature-lib.
const DATE_FORMAT = 'dd-MM-yyyy';

const todayKey = () => format(new Date(), DATE_FORMAT);

/**
 * Мягкое предложение перейти на сегодня, когда день перевалил за полночь, пока
 * приложение лежало в фоне.
 *
 * Гейт: реагируем ТОЛЬКО если юзер «следил за сегодня» — показанная дата равна
 * тому, что было сегодня на момент последнего фокуса (HEAD, отслеживающий
 * кончик ветки). Осознанно открытую историческую/будущую дату не трогаем
 * (detached HEAD) — там `displayedDate !== lastKnownToday`, тихо выходим.
 *
 * Никакого молчаливого `navigate` — только тостер с действием. Постоянная
 * страховка, если юзер смахнёт тост, — лейбл «Вчера» в SelectedDayHeading.
 *
 * Сигнал — `visibilitychange → visible`: надёжен при возврате PWA из фона и
 * переключении вкладки; `window.focus` на мобилке часто не стреляет. Холодный
 * старт уже уезжает на сегодня через index-редирект роутера, поэтому проверки
 * на маунте нет.
 *
 * «Что было сегодня» живёт в ref (in-memory) — ловим ролловер внутри
 * непрерывной сессии. Cold-restore сразу на устаревший deep-URL не покрываем:
 * он маловероятен (PWA `start_url` = `/` → редирект на сегодня).
 */
export function useRolloverNudge(displayedDate: string | undefined): void {
  const navigate = useNavigate();
  const lastKnownToday = useRef(todayKey());

  useEffect(() => {
    const check = () => {
      if (document.visibilityState !== 'visible') return;
      const today = todayKey();
      // Ролловера не было — нечего предлагать.
      if (today === lastKnownToday.current) return;

      const wasFollowingToday = displayedDate === lastKnownToday.current;
      // Сдвигаем точку отсчёта в любом случае: один день — одно предложение,
      // повторный фокус в тот же день уже не нудит.
      lastKnownToday.current = today;
      if (!wasFollowingToday) return;

      toaster.notify('Наступил новый день', {
        description: 'Сейчас открыт вчерашний рацион',
        action: {
          label: 'Открыть сегодня',
          onClick: () => navigate(RouterUrls.Schedule(todayKey())),
        },
      });
    };

    document.addEventListener('visibilitychange', check);
    return () => document.removeEventListener('visibilitychange', check);
  }, [displayedDate, navigate]);
}
