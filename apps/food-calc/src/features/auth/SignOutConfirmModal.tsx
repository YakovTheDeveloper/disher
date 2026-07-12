import { useState } from 'react';
import type { BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { ModalShell } from '@/shared/ui/ModalShell';
import { Text } from '@/shared/ui/atoms/Typography';
import { Button } from '@/shared/ui/atoms/Button';
import { runSyncTracked } from '@/shared/lib/sync/runSync';
import s from './SignOutConfirmModal.module.scss';

// Точное слово-барьер: пока пользователь не наберёт его — деструктивная кнопка
// заблокирована. Регистр/пробелы по краям нормализуем (см. `armed`).
const CONFIRM_WORD = 'удалить';

type BackupState = 'idle' | 'saving' | 'done' | 'error';

const BACKUP_LABEL: Record<BackupState, string> = {
  idle: 'Сохранить копию в облако',
  saving: 'Сохраняем…',
  done: 'Сохранено ✓',
  error: 'Не удалось — повторить',
};

export type SignOutConfirmModalProps = BaseModalProps<boolean> & {
  /** Sync ON → облачная страховка есть, предлагаем свежий бэкап; OFF → копии в
   *  облаке нет, предупреждаем (восстановить будет нечем). */
  syncEnabled: boolean;
};

/**
 * Подтверждение выхода. Выход стирает локальный Dexie + idb-keyval — барьер от
 * промаха теперь ТИПОВОЙ (ввод «удалить»), а не 5-секундное удержание. Раскрыт
 * сразу в корне дровера (без аккордеона): случайный тап по ряду лишь открывает
 * эту модалку, а не выходит. Резолвится `true` (выйти) либо `false`/`undefined`
 * (отмена / закрытие жестом).
 */
function SignOutConfirmModal({ syncEnabled, onClose }: SignOutConfirmModalProps) {
  const [value, setValue] = useState('');
  const [backup, setBackup] = useState<BackupState>('idle');
  const armed = value.trim().toLowerCase() === CONFIRM_WORD;

  // Ручной бэкап через tracked-обёртку: провал виден (toaster + sync-store), не
  // только меткой кнопки. runSyncTracked никогда не бросает — булев ведёт метку.
  const handleBackup = async () => {
    setBackup('saving');
    const ok = await runSyncTracked({ surfaceToast: true });
    setBackup(ok ? 'done' : 'error');
  };

  // Контент едет через ModalShell (канон modalStore-модалки, как CreateDailyNormModal):
  // боковой инсет держит `.wrapper` (--sys-inset-modal-fullscreen), а не рукописный
  // `.layout` — модалка больше не работает мимо шелла.
  return (
    <ModalLayout a11yLabel="Выйти из аккаунта">
      <ModalShell>
        <ModalShell.Body>
          <ModalShell.Title>Выйти из аккаунта?</ModalShell.Title>
          <Text role="caption" className={s.message}>
            {syncEnabled
              ? 'Данные на этом устройстве очистятся. Они хранятся в облаке и вернутся при следующем входе — но лучше сохранить свежую копию прямо сейчас.'
              : 'Данные на этом устройстве очистятся. Синхронизация выключена — копии в облаке нет, восстановить не получится. Скачайте копию в разделе «Данные» перед выходом.'}
          </Text>

          {syncEnabled ? (
            <Button
              variant="system-secondary"
              flat
              fullWidth
              onClick={handleBackup}
              disabled={backup === 'saving'}
            >
              {BACKUP_LABEL[backup]}
            </Button>
          ) : null}

          {/* Типовой барьер: точное слово «удалить» разблокирует выход. */}
          <label className={s.field}>
            <Text as="span" role="caption" className={s.fieldLabel}>
              Введите «удалить», чтобы подтвердить
            </Text>
            <input
              className={s.input}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label="Слово подтверждения"
            />
          </label>

          <div className={s.actions}>
            <button type="button" className={s.cancel} onClick={() => onClose(false)}>
              <Text role="label" as="span">
                Отмена
              </Text>
            </button>
            <button
              type="button"
              className={s.confirmDanger}
              disabled={!armed}
              onClick={() => onClose(true)}
            >
              <Text role="label" as="span">
                Выйти
              </Text>
            </button>
          </div>
        </ModalShell.Body>
      </ModalShell>
    </ModalLayout>
  );
}

export default SignOutConfirmModal;
