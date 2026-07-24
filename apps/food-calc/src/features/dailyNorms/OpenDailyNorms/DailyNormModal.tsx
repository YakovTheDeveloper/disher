import { useState } from 'react';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { ModalShell } from '@/shared/ui/ModalShell';
import { type BaseModalProps } from '@/shared/ui';
import { ChoiceGroup, ChoiceItem } from '@/shared/ui/atoms/Choice';
import { Text } from '@/shared/ui/atoms/Typography';
import { useNormMethodStore, type NormMethod } from '@/features/dailyNorms/model';
import CreateDailyNormModal from './CreateDailyNormModal';
import EditDailyNormModal from './EditDailyNormModal';
import styles from './DailyNormModal.module.scss';

/**
 * Модалка «Дневная норма» — единая точка входа флажка нормы. Два способа (анкета /
 * вручную) через `ChoiceItem`. Открывается на вкладке ПОСЛЕДНЕГО закоммиченного
 * способа (norm-method persist), пока ничего не задано (`null`) — тихий хинт. По
 * выбору рендерит тело; кнопка подтверждения — ЧАСТЬ тела (не футер модалки):
 * survey → CreateDailyNormModal(panel), manual → EditDailyNormModal(panel).
 *
 * Активная вкладка — ЛОКАЛЬНЫЙ стейт (init из persist). persist `method` пишется
 * ТОЛЬКО на коммите тела (не на клике вкладки): иначе клик «анкета» неотличим от
 * «норму задали анкетой», и survey-тело показало бы фиктивный «результат» из
 * дефолт-анкеты вместо кнопки, когда норма на деле задана вручную.
 */
const DailyNormModal = ({ onClose }: BaseModalProps) => {
  const committedMethod = useNormMethodStore((s) => s.method);
  const [tab, setTab] = useState<NormMethod | null>(committedMethod);

  return (
    <ModalLayout a11yLabel="Дневная норма">
      <ModalShell>
        <ModalShell.Header title="Дневная норма" onBack={onClose} />
        <ModalShell.Body>
          <div className={styles.layout}>
            <ChoiceGroup
              className={styles.methodGroup}
              orientation="vertical"
              onSurface={0}
              aria-label="Способ ввода нормы"
              value={tab}
              onChange={(v) => setTab(v as NormMethod)}
            >
              <ChoiceItem className={styles.methodItem} value="survey" stacked>
                <Text as="span" role="label" className={styles.methodTitle}>
                  Рассчитать по анкете
                </Text>
                <Text as="span" role="caption" className={styles.methodHint}>
                  Несколько ответов — посчитаем БЖУ, калории и основные микроэлементы
                </Text>
              </ChoiceItem>
              <ChoiceItem className={styles.methodItem} value="manual" stacked>
                <Text as="span" role="label" className={styles.methodTitle}>
                  Установить вручную
                </Text>
                <Text as="span" role="caption" className={styles.methodHint}>
                  Ввести значения нутриентов самостоятельно
                </Text>
              </ChoiceItem>
            </ChoiceGroup>

            {tab === 'survey' && (
              <div className={styles.bodySlot}>
                <CreateDailyNormModal chrome="panel" onClose={onClose} />
              </div>
            )}
            {tab === 'manual' && (
              <div className={styles.bodySlot}>
                <EditDailyNormModal chrome="panel" onClose={onClose} />
              </div>
            )}
            {tab == null && (
              <Text as="p" role="caption" className={styles.emptyHint}>
                Выберите способ, чтобы задать дневную норму.
              </Text>
            )}
          </div>
        </ModalShell.Body>
      </ModalShell>
    </ModalLayout>
  );
};

export default DailyNormModal;
