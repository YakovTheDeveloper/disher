#!/usr/bin/env bash
# Передеплой SPA disher на прод в одну команду: сборка → доставка → атомарный swap → проверка.
#
# ТОПОЛОГИЯ (почему не «просто scp в веб-рут»):
# 80/443 на боксе держит ЧУЖОЙ nginx-контейнер (`edge-proxy-nginx-1`), который фронтит
# живой прод соседнего продукта (VPN edgebyte). Его нельзя пересоздавать → нельзя добавить
# новый volume-монт. Поэтому SPA кладётся в ПОДПАПКУ уже смонтированного каталога:
#   /opt/edge-proxy/frontend/disher   (хост)  ==  /usr/share/nginx/html/disher  (контейнер)
# nginx уже настроен на неё (server_name disher.life, try_files → /index.html).
# Скрипт НЕ трогает nginx вообще — только содержимое каталога.
#
# СБОРКА ТОЛЬКО ЛОКАЛЬНО. На боксе 1 vCPU / 1 GB — vite/tsc там уходят в OOM.
#
# Использование:
#   ./scripts/deploy-spa.sh                  # обычный передеплой (type-гейт активен)
#   ./scripts/deploy-spa.sh --no-typecheck   # выкатить, несмотря на красный type-гейт
#   ./scripts/deploy-spa.sh --dry-run        # собрать и проверить, но не выкатывать
#
# Откат: предыдущий релиз остаётся на боксе как `disher.prev` —
#   ssh disher 'cd /opt/edge-proxy/frontend && rm -rf disher && mv disher.prev disher'
set -euo pipefail

SSH_HOST="${SSH_HOST:-disher}"
API_BASE="${VITE_API_BASE:-https://api.disher.life}"
SPA_URL="${SPA_URL:-https://disher.life}"
NEIGHBOR_URL="${NEIGHBOR_URL:-https://cp.edgebyte.ru}"   # чужой прод — обязан выжить
REMOTE_ROOT="/opt/edge-proxy/frontend"

SKIP_TC=0
DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --no-typecheck) SKIP_TC=1 ;;
    --dry-run)      DRY_RUN=1 ;;
    -h|--help)      sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "Неизвестный флаг: $arg" >&2; exit 2 ;;
  esac
done

cd "$(dirname "$0")/.."          # apps/food-calc
REPO_ROOT="$(cd ../.. && pwd)"

# ── 1. Сборка ────────────────────────────────────────────────────────────────
echo "▶ Сборка SPA (VITE_API_BASE=$API_BASE)…"
BUILD_ENV=(VITE_API_BASE="$API_BASE")
if (( SKIP_TC )); then
  echo "  ⚠  type-гейт ОТКЛЮЧЁН (--no-typecheck)."
  BUILD_ENV+=(SKIP_TYPECHECK=1)
fi

if ! env "${BUILD_ENV[@]}" pnpm --filter @disher/frontend build; then
  echo >&2
  echo "✗ Сборка упала." >&2
  if (( ! SKIP_TC )); then
    echo "  Если это ошибки ТИПОВ в не-прод коде (тест-фикстуры, dev-предложки) —" >&2
    echo "  их надо починить. Разовый обход: ./scripts/deploy-spa.sh --no-typecheck" >&2
  fi
  exit 1
fi

# ── 2. Проверки собранного ДО выкатки ────────────────────────────────────────
# Ловим самую дорогую ошибку: бандл, который смотрит в localhost вместо прода —
# внешне «задеплоилось успешно», а приложение мертво.
[[ -f dist/index.html ]] || { echo "✗ dist/index.html нет — сборка пустая?" >&2; exit 1; }
if ! grep -rqF "$API_BASE" dist/assets/ 2>/dev/null; then
  echo "✗ В бандле НЕТ '$API_BASE' — VITE_API_BASE не подхватился. Выкатка отменена." >&2
  exit 1
fi
if grep -rqF "localhost:3100" dist/assets/ 2>/dev/null; then
  echo "✗ В бандле остался 'localhost:3100'. Выкатка отменена." >&2
  exit 1
fi
echo "✓ Бандл смотрит на $API_BASE ($(du -sh dist | cut -f1))"

if (( DRY_RUN )); then echo "— dry-run: выкатка пропущена."; exit 0; fi

# ── 3. Доставка + атомарный swap ─────────────────────────────────────────────
# Заливаем в disher.new, потом одним `mv` подменяем — чтобы юзер никогда не попал
# на полураспакованный каталог (index.html новый, ассеты ещё старые = белый экран).
echo "▶ Доставка на $SSH_HOST…"
TARBALL="$(mktemp -u).tgz"
tar -czf "$TARBALL" -C dist .
trap 'rm -f "$TARBALL"' EXIT

ssh "$SSH_HOST" "rm -rf '$REMOTE_ROOT/disher.new' && mkdir -p '$REMOTE_ROOT/disher.new'"
scp -q "$TARBALL" "$SSH_HOST:/tmp/disher-spa.tgz"
ssh "$SSH_HOST" "set -e
  tar -xzf /tmp/disher-spa.tgz -C '$REMOTE_ROOT/disher.new'
  rm -f /tmp/disher-spa.tgz
  test -f '$REMOTE_ROOT/disher.new/index.html'
  rm -rf '$REMOTE_ROOT/disher.prev'
  test -d '$REMOTE_ROOT/disher' && mv '$REMOTE_ROOT/disher' '$REMOTE_ROOT/disher.prev' || true
  mv '$REMOTE_ROOT/disher.new' '$REMOTE_ROOT/disher'
  chmod -R a+rX '$REMOTE_ROOT/disher'"
echo "✓ Выкачено (предыдущий релиз сохранён как disher.prev)"

# ── 4. Проверка живого прода ─────────────────────────────────────────────────
echo "▶ Проверка…"
fail=0
code() { curl -s -o /dev/null -w '%{http_code}' "$1"; }

c_root="$(code "$SPA_URL/")"
c_deep="$(code "$SPA_URL/settings")"        # SPA-роутинг (try_files), а не 404
c_api="$(code "$API_BASE/health/ready")"
c_nb="$(code "$NEIGHBOR_URL/")"             # соседний прод

printf '  %-34s %s\n' "$SPA_URL/"            "$c_root"
printf '  %-34s %s\n' "$SPA_URL/settings"    "$c_deep"
printf '  %-34s %s\n' "$API_BASE/health/ready" "$c_api"
printf '  %-34s %s  (сосед)\n' "$NEIGHBOR_URL/" "$c_nb"

[[ "$c_root" == 200 ]] || { echo "  ✗ SPA не отдаётся"; fail=1; }
[[ "$c_deep" == 200 ]] || { echo "  ✗ глубокий роут не работает (try_files?)"; fail=1; }
[[ "$c_api"  == 200 ]] || { echo "  ✗ бэкенд нездоров"; fail=1; }
[[ "$c_nb"   == 200 ]] || { echo "  ✗ СОСЕДНИЙ ПРОД УПАЛ — разбираться немедленно"; fail=1; }

# Отданный сервером бандл (а не только локальный dist) обязан смотреть на прод-API.
# ВАЖНО: не `curl … | grep -q` — под `set -o pipefail` grep -q выходит по первому
# совпадению, curl ловит SIGPIPE и валит весь конвейер ИМЕННО КОГДА строка нашлась
# (ложный «не нашли»). Забираем тело в переменную, ищем отдельно.
html="$(curl -s "$SPA_URL/")"
js="$(grep -oE '/assets/index-[^"]+\.js' <<<"$html" | head -1 || true)"
if [[ -n "$js" ]]; then
  bundle="$(curl -s "$SPA_URL$js")"
  if grep -qF "$API_BASE" <<<"$bundle"; then
    echo "  ✓ отданный бандл ($js) смотрит на $API_BASE"
  else
    echo "  ✗ отданный бандл НЕ ссылается на $API_BASE"; fail=1
  fi
else
  echo "  ✗ в отданном index.html не найден /assets/index-*.js"; fail=1
fi

if (( fail )); then
  echo >&2
  echo "✗ Проверка провалена. Откат:" >&2
  echo "  ssh $SSH_HOST \"cd $REMOTE_ROOT && rm -rf disher && mv disher.prev disher\"" >&2
  exit 1
fi

echo
echo "✅ SPA задеплоен: $SPA_URL"
