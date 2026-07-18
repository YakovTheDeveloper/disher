import { useState } from 'react';
import type { BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { ModalShell } from '@/shared/ui/ModalShell';
import { Text } from '@/shared/ui/atoms/Typography';
import { Button } from '@/shared/ui/atoms/Button';
import { runSyncTracked } from '@/shared/lib/sync/runSync';
import { SyncStatusBar } from '@/features/sync-status/SyncStatusBar';
import { finalSyncBeforeSignOut } from './auth-store';
import s from './SignOutConfirmModal.module.scss';

// Точное слово-барьер: пока пользователь не наберёт его — деструктивная кнопка
// заблокирована. Регистр/пробелы по краям нормализуем (см. `armed`).
const CONFIRM_WORD = 'выйти';

type BackupState = 'idle' | 'saving' | 'done' | 'error';

const BACKUP_LABEL: Record<BackupState, string> = {
  idle: 'Сохранить копию в облако',
  saving: 'Сохраняем…',
  done: 'Сохранено ✓',
  error: 'Не удалось — повторить',
};

// Фаза модалки. `syncing` — идёт финальный (ограниченный по времени) push перед
// стиранием Dexie; `sync-failed` — он провалился, и вопрос переворачивается:
// выход теперь означает ПОТЕРЮ несохранённых изменений, поэтому пользователь
// решает это осознанно, а не узнаёт постфактум.
type Phase = 'confirm' | 'syncing' | 'sync-failed';

export type SignOutConfirmModalProps = BaseModalProps<boolean>;

/**
 * Подтверждение выхода. Выход стирает локальный Dexie + idb-keyval — барьер от
 * промаха теперь ТИПОВОЙ (ввод «удалить»), а не 5-секундное удержание. Раскрыт
 * сразу в корне дровера (без аккордеона): случайный тап по ряду лишь открывает
 * эту модалку, а не выходит. Резолвится `true` (выйти) либо `false`/`undefined`
 * (отмена / закрытие жестом).
 */
function SignOutConfirmModal({ onClose }: SignOutConfirmModalProps) {
  const [value, setValue] = useState('');
  const [backup, setBackup] = useState<BackupState>('idle');
  const [phase, setPhase] = useState<Phase>('confirm');
  const armed = value.trim().toLowerCase() === CONFIRM_WORD;

  // Ручной бэкап через tracked-обёртку: провал виден (toaster + sync-store), не
  // только меткой кнопки. runSyncTracked никогда не бросает — булев ведёт метку.
  const handleBackup = async () => {
    setBackup('saving');
    const ok = await runSyncTracked({ surfaceToast: true });
    setBackup(ok ? 'done' : 'error');
  };

  // Финальный push ЗДЕСЬ, а не внутри signOut: только у модалки есть, чем
  // спросить. Провал (сеть/висящий сервер/таймаут) переводит в 'sync-failed' —
  // выход остаётся возможен, но уже как осознанный выбор потерять изменения.
  // Резолвим `true` только после того, как решение принято.
  const handleConfirm = async () => {
    setPhase('syncing');
    const ok = await finalSyncBeforeSignOut();
    if (ok) {
      onClose(true);
      return;
    }
    setPhase('sync-failed');
  };

  // Контент едет через ModalShell (канон modalStore-модалки, как CreateDailyNormModal):
  // боковой инсет держит `.wrapper` (--sys-inset-modal-fullscreen), а не рукописный
  // `.layout` — модалка больше не работает мимо шелла.
  if (phase === 'sync-failed') {
    return (
      <ModalLayout a11yLabel="Синхронизация перед выходом не удалась">
        <ModalShell>
          <ModalShell.Header
            title="Не удалось сохранить в облако"
            onBack={() => onClose(false)}
            backLabel="Остаться"
          />
          <ModalShell.Body>
            <Text role="caption" className={s.message}>
              Последняя синхронизация перед выходом не прошла — нет сети или сервер не отвечает.
              Изменения, сделанные после прошлой синхронизации, есть только на этом устройстве, а
              выход его очистит: они пропадут.
            </Text>
            <Text role="caption" className={s.message}>
              Можно остаться, дождаться сети и выйти позже — или скачать копию файлом в разделе
              «Данные».
            </Text>

            <div className={s.actions}>
              <button type="button" className={s.cancel} onClick={() => onClose(false)}>
                <Text role="label" as="span">
                  Остаться
                </Text>
              </button>
              <button type="button" className={s.confirmDanger} onClick={() => onClose(true)}>
                <Text role="label" as="span">
                  Всё равно выйти
                </Text>
              </button>
            </div>
          </ModalShell.Body>
        </ModalShell>
      </ModalLayout>
    );
  }

  const syncing = phase === 'syncing';

  return (
    <ModalLayout a11yLabel="Выйти из аккаунта">
      <ModalShell>
        <ModalShell.Header
          title="Выйти из аккаунта?"
          onBack={() => {
            // Зеркалит `disabled` у «Отмена»: пока идёт финальный push, уход из
            // модалки оставил бы sync без адресата решения.
            if (!syncing) onClose(false);
          }}
          backLabel="Отмена"
        />
        <ModalShell.Body>
          <Text role="caption" className={s.message}>
            Данные на этом устройстве очистятся. Они хранятся в облаке и вернутся при
            следующем входе — но лучше сохранить свежую копию прямо сейчас.
          </Text>

          <Button
            variant="system"
            fullWidth
            onClick={handleBackup}
            disabled={backup === 'saving' || syncing}
          >
            {BACKUP_LABEL[backup]}
          </Button>
          <SyncStatusBar />

          {/* Типовой барьер: точное слово «выйти» разблокирует выход. */}
          <label className={s.field}>
            <Text as="span" role="caption" className={s.fieldLabel}>
              Введите «выйти», чтобы подтвердить
            </Text>
            <input
              className={s.input}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={syncing}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label="Слово подтверждения"
            />
          </label>

          <div className={s.actions}>
            <button
              type="button"
              className={s.cancel}
              disabled={syncing}
              onClick={() => onClose(false)}
            >
              <Text role="label" as="span">
                Отмена
              </Text>
            </button>
            <button
              type="button"
              className={s.confirmDanger}
              disabled={!armed || syncing}
              onClick={handleConfirm}
            >
              <Text role="label" as="span">
                {syncing ? 'Сохраняем…' : 'Выйти'}
              </Text>
            </button>
          </div>
        </ModalShell.Body>
      </ModalShell>
    </ModalLayout>
  );
}

export default SignOutConfirmModal;
