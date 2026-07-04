import { useState } from 'react';
import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import { Button } from '@/shared/ui/atoms/Button';
import { dump } from '@/shared/lib/snapshot';
import s from './SyncDisableDrawer.module.scss';

// OFF-flow warning for cloud sync. Turning sync off is the private/destructive
// moment: the server copy of the vault is DELETED (consent withdrawal / GDPR
// right-to-erasure). The local Dexie copy is the source of truth and stays, so
// nothing is lost on-device — but we offer a full-data download first
// (portability) before the erase. Resolves to `true` (confirm OFF + erase) or
// `false`/`undefined` (cancel → sync stays ON). Erase + flag flip happen in the
// caller (ProfileDrawer). The download/cancel/danger buttons are hand-styled
// (mirroring ConfirmDrawer) so the danger tone stays token-driven; «Скачать
// выгрузку» is the Button atom and the drawer stays open after it.
const downloadJson = (name: string, obj: unknown) => {
  const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

export type SyncDisableDrawerProps = BaseDrawerProps<boolean>;

function SyncDisableDrawer({ onClose }: SyncDisableDrawerProps) {
  const [exported, setExported] = useState(false);

  const handleExport = async () => {
    const today = new Date().toISOString().slice(0, 10);
    downloadJson(`disher-${today}.json`, await dump());
    setExported(true);
  };

  return (
    <DrawerLayout title="Подтверждение">
      <div className={s.body}>
        <Heading role="headline" as="h3" className={s.title}>
          Выключить синхронизацию?
        </Heading>
        <Text role="caption" className={s.message}>
          Копия данных на сервере будет удалена. Данные останутся на этом
          устройстве, но больше не будут попадать в облако. Скачайте полную
          выгрузку перед выключением — на случай потери устройства.
        </Text>

        <Button
          variant="system-secondary"
          flat
          fullWidth
          onClick={handleExport}
        >
          {exported ? 'Выгрузка скачана ✓' : 'Скачать выгрузку'}
        </Button>

        <div className={s.actions}>
          <button type="button" className={s.cancel} onClick={() => onClose(false)}>
            <Text role="label" as="span">
              Отмена
            </Text>
          </button>
          <button type="button" className={s.confirmDanger} onClick={() => onClose(true)}>
            <Text role="label" as="span">
              Выключить и удалить
            </Text>
          </button>
        </div>
      </div>
    </DrawerLayout>
  );
}

export default SyncDisableDrawer;
