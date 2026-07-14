#!/usr/bin/env bash
# Доставка .env.production на прод-VPS (out-of-band, НЕ через git).
#
# Секреты прода не лежат в репозитории (.env.production в .gitignore, а репо
# публичный) — значит единственный путь на сервер это scp. Этот скрипт делает
# такой перенос безопасным.
#
# ЗАЧЕМ ГАРДЫ. Рядом лежит `.env.smoke` — фейковые значения (devsmokepass /
# sk-or-dummy / нулевой auth-секрет) для локального смоука. Если случайно указать
# его источником, он перезапишет на проде настоящий POSTGRES_PASSWORD (база уже
# инициализирована старым!) и BETTER_AUTH_SECRET — бэкенд не поднимется, а все
# сессии протухнут. Поэтому:
#   * источник задаётся ЯВНО (по умолчанию — реальный env вне репо);
#   * файл с dummy-маркерами отбивается наотрез;
#   * удалённый файл бэкапится с таймстампом ДО перезаписи;
#   * показывается key-level дифф (значения маскируются) и спрашивается подтверждение.
#
# Использование:
#   ./scripts/push-env.sh                      # из ~/.disher/env.production, с подтверждением
#   ./scripts/push-env.sh path/to/env          # свой источник
#   ./scripts/push-env.sh --restart            # + перезапустить backend и проверить /health/ready
#   ./scripts/push-env.sh --yes --restart      # без интерактива (для CI)
#
# Откат: на сервере лежат бэкапы .env.production.bak-<timestamp> — скопировать нужный
# обратно и перезапустить backend.
set -euo pipefail

SSH_HOST="${SSH_HOST:-disher}"
REMOTE_DIR="${REMOTE_DIR:-/srv/disher/apps/disher-backend-3.0}"
REMOTE_ENV="$REMOTE_DIR/.env.production"
SRC="${DISHER_ENV:-$HOME/.disher/env.production}"

ASSUME_YES=0
RESTART=0
for arg in "$@"; do
  case "$arg" in
    --yes|-y)   ASSUME_YES=1 ;;
    --restart)  RESTART=1 ;;
    -h|--help)  sed -n '2,28p' "$0"; exit 0 ;;
    -*)         echo "Неизвестный флаг: $arg" >&2; exit 2 ;;
    *)          SRC="$arg" ;;
  esac
done

[[ -f "$SRC" ]] || { echo "ERROR: не найден источник: $SRC" >&2; exit 1; }

# ── Гард 1: dummy-маркеры ────────────────────────────────────────────────────
# Заливка .env.smoke на прод = сломанный бэкенд, поэтому это hard fail, а не warning.
if grep -qiE 'SMOKE|devsmokepass|sk-or-dummy|re_dummy|telegram-dummy|REPLACE_ME|^BETTER_AUTH_SECRET=0+f*$' "$SRC"; then
  echo "ERROR: в '$SRC' найдены dummy/плейсхолдер-значения — это НЕ прод-секреты." >&2
  echo "       Похоже, это .env.smoke. Пуш отменён." >&2
  exit 1
fi

# ── Гард 2: обязательные ключи ───────────────────────────────────────────────
# Без любого из них бэкенд либо не стартует, либо стартует сломанным.
MISSING=()
for k in POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB LOCAL_DATABASE_URL \
         BETTER_AUTH_SECRET BETTER_AUTH_URL FRONTEND_ORIGIN OPENROUTER_API_KEY; do
  grep -qE "^${k}=.+" "$SRC" || MISSING+=("$k")
done
if (( ${#MISSING[@]} )); then
  echo "ERROR: в '$SRC' нет обязательных ключей: ${MISSING[*]}" >&2
  exit 1
fi

mask() { sed -E 's/(KEY=|SECRET=|PASSWORD=|:\/\/[^:]+:)[^@[:space:]]{6,}/\1***/'; }

echo "Источник: $SRC"
echo "Цель:     $SSH_HOST:$REMOTE_ENV"
echo

# ── Дифф по КЛЮЧАМ (значения не печатаем — только что добавится/исчезнет/изменится) ──
REMOTE_TMP="$(mktemp)"; trap 'rm -f "$REMOTE_TMP"' EXIT
if ssh "$SSH_HOST" "cat '$REMOTE_ENV' 2>/dev/null" > "$REMOTE_TMP" && [[ -s "$REMOTE_TMP" ]]; then
  echo "=== Изменения (значения замаскированы) ==="
  diff <(mask < "$REMOTE_TMP" | grep -E '^[A-Z_]+=' | sort) \
       <(mask < "$SRC"        | grep -E '^[A-Z_]+=' | sort) \
    && echo "(различий по ключам нет)"
  echo

  # Пароль Postgres менять на живой базе нельзя: том pgdata уже инициализирован
  # СТАРЫМ паролем, новый в .env его не переучит — backend просто не подключится.
  OLD_PW="$(grep -E '^POSTGRES_PASSWORD=' "$REMOTE_TMP" | cut -d= -f2- || true)"
  NEW_PW="$(grep -E '^POSTGRES_PASSWORD=' "$SRC"        | cut -d= -f2- || true)"
  if [[ -n "$OLD_PW" && "$OLD_PW" != "$NEW_PW" ]]; then
    echo "⚠  ВНИМАНИЕ: POSTGRES_PASSWORD отличается от текущего на сервере."
    echo "   Том pgdata уже инициализирован СТАРЫМ паролем — смена в .env его не"
    echo "   поменяет, backend потеряет доступ к БД. Меняй пароль через ALTER ROLE"
    echo "   в самой базе, а не тут."
    echo
  fi
else
  echo "(на сервере .env.production ещё нет — первая доставка)"
  echo
fi

if (( ! ASSUME_YES )); then
  read -r -p "Залить? [y/N] " ans
  [[ "$ans" =~ ^[Yy]$ ]] || { echo "Отменено."; exit 0; }
fi

# ── Бэкап + доставка ─────────────────────────────────────────────────────────
STAMP="$(date +%Y%m%d-%H%M%S)"
ssh "$SSH_HOST" "test -f '$REMOTE_ENV' && cp '$REMOTE_ENV' '$REMOTE_ENV.bak-$STAMP' || true"
scp -q "$SRC" "$SSH_HOST:$REMOTE_ENV"
ssh "$SSH_HOST" "chmod 600 '$REMOTE_ENV'"
echo "✅ Доставлено. Бэкап прежнего: $REMOTE_ENV.bak-$STAMP"

if (( RESTART )); then
  echo
  echo "=== Перезапуск backend ==="
  ssh "$SSH_HOST" "cd '$REMOTE_DIR' && export IMAGE_TAG=\$(git rev-parse --short HEAD) && docker compose up -d --wait backend" 2>&1 | tail -3
  echo
  echo "=== Проверка ==="
  code="$(ssh "$SSH_HOST" "curl -s -o /dev/null -w '%{http_code}' http://localhost/health/ready -H 'Host: api.disher.life'" || true)"
  ssh "$SSH_HOST" "cd '$REMOTE_DIR' && docker compose ps --format 'table {{.Service}}\t{{.Status}}'"
  echo
  if [[ "$code" == "200" ]]; then
    echo "✅ /health/ready → 200"
  else
    echo "❌ /health/ready → $code — проверь логи: ssh $SSH_HOST 'cd $REMOTE_DIR && docker compose logs --tail 50 backend'"
    echo "   Откат: ssh $SSH_HOST \"cp $REMOTE_ENV.bak-$STAMP $REMOTE_ENV\" && повтори с --restart"
    exit 1
  fi
fi
