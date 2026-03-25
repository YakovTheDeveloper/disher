import { memo, useEffect, useRef, useState, useCallback } from "react";
import ModalByLabel from "@/features/shared/components/ModalByLabel/ModalByLabel.tsx";
import s from "./MiscPage.module.scss";

const API_BASE = `http://${window.location.hostname}:3100`;
const PAGE_SIZE = 100;
const UNDO_DELAY = 2000;

/**
 * Suspect IDs — empty after cleanup.
 * 1062 products deleted from combined-foods.json (was 2694 → now 1632).
 * Deleted: composite dishes, cooked/canned/frozen/dried duplicates,
 * technical ingredients, US brands, exotic plants, fat% duplicates, etc.
 */
const SUSPECT_IDS = new Set<string>([]);

interface CombinedFood {
  id: string;
  nameEng: string;
  nameRu: string;
  source: string;
  categories: string[];
}

// ── Edit Modal Content ──────────────────────────────────────────────────────

function EditForm({
  food,
  onSave,
  onClose,
  inputId,
}: {
  food: CombinedFood;
  onSave: (id: string, nameRu: string, nameEng: string) => void;
  onClose: () => void;
  inputId: string;
}) {
  const [nameRu, setNameRu] = useState(food.nameRu);
  const [nameEng, setNameEng] = useState(food.nameEng);
  const [saving, setSaving] = useState(false);

  const dirty = nameRu !== food.nameRu || nameEng !== food.nameEng;

  const handleSave = async () => {
    if (!dirty) return onClose();
    setSaving(true);
    onSave(food.id, nameRu, nameEng);
  };

  return (
    <div className={s.editForm}>
      <header className={s.editHeader}>
        <button type="button" className={s.editCancel} onClick={onClose}>
          Закрыть
        </button>
        <span className={s.editTitle}>Редактирование</span>
        <button
          type="button"
          className={s.editSave}
          onClick={handleSave}
          disabled={!dirty || saving}
        >
          {saving ? "…" : "Сохранить"}
        </button>
      </header>

      <div className={s.editBody}>
        <div className={s.editField}>
          <span className={s.editLabel}>ID</span>
          <span className={s.editId}>{food.id}</span>
        </div>
        <div className={s.editField}>
          <span className={s.editLabel}>Источник</span>
          <span className={s.editSource}>{food.source}</span>
        </div>
        <div className={s.editField}>
          <label className={s.editLabel} htmlFor={`${inputId}-ru`}>
            Название (рус)
          </label>
          <input
            id={`${inputId}-ru`}
            className={s.editInput}
            value={nameRu}
            onChange={(e) => setNameRu(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className={s.editField}>
          <label className={s.editLabel} htmlFor={`${inputId}-eng`}>
            Название (eng)
          </label>
          <input
            id={`${inputId}-eng`}
            className={s.editInput}
            value={nameEng}
            onChange={(e) => setNameEng(e.target.value)}
            autoComplete="off"
          />
        </div>
        {food.categories.length > 0 && (
          <div className={s.editField}>
            <span className={s.editLabel}>Категории</span>
            <span className={s.editCategories}>{food.categories.join(", ")}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Row ─────────────────────────────────────────────────────────────────────

const Row = memo(function Row({
  food,
  onDelete,
  onUndo,
  pending,
  deleting,
}: {
  food: CombinedFood;
  onDelete: (id: string) => void;
  onUndo: (id: string) => void;
  pending: boolean;
  deleting: boolean;
}) {
  const showBoth = food.nameRu && food.nameRu !== food.nameEng;

  return (
    <div
      className={`${s.row} ${pending ? s.rowPending : ""} ${deleting ? s.rowDeleting : ""}`}
    >
      {pending && <div className={s.countdown} />}
      <label className={s.name} htmlFor={`edit-${food.id}`}>
        <div className={s.nameRu}>
          {SUSPECT_IDS.has(food.id) && <span className={s.suspectDot} title="Сомнительный продукт" />}
          {food.nameRu || food.nameEng}
        </div>
        {showBoth && <div className={s.nameEng}>{food.nameEng}</div>}
        <div className={s.sourceBadge}>{food.source}</div>
      </label>
      {pending ? (
        <button
          type="button"
          className={s.undoBtn}
          onClick={() => onUndo(food.id)}
        >
          Отмена
        </button>
      ) : (
        <button
          type="button"
          className={`${s.deleteBtn} ${deleting ? s.busy : ""}`}
          onClick={() => onDelete(food.id)}
          disabled={deleting}
          aria-label="Удалить"
        >
          {deleting ? <span className={s.spinner} /> : "✕"}
        </button>
      )}
    </div>
  );
});

// ── Pager ───────────────────────────────────────────────────────────────────

function Pager({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className={s.pager}>
      <button
        type="button"
        className={s.pagerBtn}
        disabled={page === 0}
        onClick={() => onPage(page - 1)}
      >
        ←
      </button>
      <span className={s.pagerInfo}>
        {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} из {total}
      </span>
      <button
        type="button"
        className={s.pagerBtn}
        disabled={page >= totalPages - 1}
        onClick={() => onPage(page + 1)}
      >
        →
      </button>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function MiscPage() {
  const [foods, setFoods] = useState<CombinedFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [toast, setToast] = useState("");
  const [showSuspectOnly, setShowSuspectOnly] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const pendingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/parser/combined/foods`)
      .then((r) => r.json())
      .then((data: { foods: CombinedFood[] }) => {
        setFoods(data.foods ?? []);
        setLoading(false);
      })
      .catch(() => {
        showToast("Ошибка загрузки");
        setLoading(false);
      });
  }, [showToast]);

  useEffect(() => {
    const timers = pendingTimers.current;
    return () => {
      for (const t of timers.values()) clearTimeout(t);
    };
  }, []);

  const executeDelete = useCallback(
    async (id: string) => {
      pendingTimers.current.delete(id);
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setDeleting((prev) => new Set(prev).add(id));
      try {
        const res = await fetch(`${API_BASE}/parser/combined/foods/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setFoods((prev) => prev.filter((f) => f.id !== id));
      } catch (e) {
        showToast(`Ошибка: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setDeleting((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [showToast],
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (pendingTimers.current.has(id)) return;
      setPending((prev) => new Set(prev).add(id));
      const timer = setTimeout(() => executeDelete(id), UNDO_DELAY);
      pendingTimers.current.set(id, timer);
    },
    [executeDelete],
  );

  const handleUndo = useCallback((id: string) => {
    const timer = pendingTimers.current.get(id);
    if (timer) clearTimeout(timer);
    pendingTimers.current.delete(id);
    setPending((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // ── Edit handlers ───────────────────────────────────────────────────────

  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const id = (e.target as HTMLElement).id;
    if (id?.startsWith("edit-")) {
      setEditingId(id.replace("edit-", ""));
    }
  }, []);

  const handleSave = useCallback(
    async (id: string, nameRu: string, nameEng: string) => {
      try {
        const res = await fetch(`${API_BASE}/parser/combined/foods/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nameRu, nameEng }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setFoods((prev) =>
          prev.map((f) => (f.id === id ? { ...f, nameRu, nameEng } : f)),
        );
        setEditingId(null);
      } catch (e) {
        showToast(`Ошибка: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
    [showToast],
  );

  const handleCloseEdit = useCallback(() => setEditingId(null), []);

  // ── Filtering & pagination ──────────────────────────────────────────────

  const filtered = foods.filter((f) => {
    if (showSuspectOnly && !SUSPECT_IDS.has(f.id)) return false;
    if (search) {
      const q = search.toLowerCase();
      return f.nameRu.toLowerCase().includes(q) || f.nameEng.toLowerCase().includes(q);
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const pageItems = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const editingFood = editingId ? foods.find((f) => f.id === editingId) : null;

  return (
    <div className={s.page} onFocusCapture={handleFocusCapture}>
      <header className={s.header}>
        <div className={s.stats}>
          <span>
            Продуктов: <b>{foods.length}</b>
          </span>
          {search && filtered.length !== foods.length && (
            <span>
              Найдено: <b>{filtered.length}</b>
            </span>
          )}
        </div>
        <div className={s.controls}>
          <input
            type="search"
            className={s.search}
            placeholder="Поиск по названию…"
            autoComplete="off"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
          <button
            type="button"
            className={`${s.suspectBtn} ${showSuspectOnly ? s.active : ""}`}
            onClick={() => {
              setShowSuspectOnly((v) => !v);
              setPage(0);
            }}
          >
            <span className={s.suspectDot} />
            {showSuspectOnly ? `${SUSPECT_IDS.size}` : "⚑"}
          </button>
        </div>
      </header>

      <div className={s.scrollArea}>
        {loading ? (
          <div className={s.loading}>Загрузка…</div>
        ) : filtered.length === 0 ? (
          <div className={s.empty}>Ничего не найдено</div>
        ) : (
          <>
            {totalPages > 1 && (
              <Pager
                page={safePage}
                totalPages={totalPages}
                total={filtered.length}
                onPage={setPage}
              />
            )}
            {pageItems.map((food) => (
              <Row
                key={food.id}
                food={food}
                onDelete={handleDelete}
                onUndo={handleUndo}
                pending={pending.has(food.id)}
                deleting={deleting.has(food.id)}
              />
            ))}
            {totalPages > 1 && (
              <Pager
                page={safePage}
                totalPages={totalPages}
                total={filtered.length}
                onPage={setPage}
              />
            )}
          </>
        )}
      </div>

      {/* Hidden inputs for label→focus triggering */}
      {pageItems.map((food) => (
        <input
          key={food.id}
          id={`edit-${food.id}`}
          className={s.hiddenInput}
          tabIndex={-1}
          readOnly
        />
      ))}

      {/* Edit modal */}
      <ModalByLabel
        position="fixed"
        isExpanded={!!editingFood}
        content={
          editingFood ? (
            <EditForm
              key={editingFood.id}
              food={editingFood}
              onSave={handleSave}
              onClose={handleCloseEdit}
              inputId={`edit-${editingFood.id}`}
            />
          ) : null
        }
      />

      <div className={`${s.toast} ${toast ? s.show : ""}`}>{toast}</div>
    </div>
  );
}
