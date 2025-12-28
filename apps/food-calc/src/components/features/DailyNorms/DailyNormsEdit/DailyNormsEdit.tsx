import { observer } from 'mobx-react-lite';
import styles from './DailyNormsEdit.module.scss';
import { nutrientGroups } from '@/components/features/builders/food/shared/ContentInfo/Nutrients/constants';
import { DailyNormsViewModel } from '@/components/features/DailyNorms/viewModel/DailyNormsViewModel';
import { ListItem } from '@/components/features/DailyNorms/DailyNormsEdit/ListItem';

export type Nutrient = {
  id: number;
  name: string;
  displayName: string;
  displayNameRu: string;
  unit: string;
  unitRu: string;
};

type NutrientGroup = {
  name: string;
  displayName: string;
  content: Nutrient[];
};

type Props = {
  store: DailyNormsViewModel;
  variant: 'view' | 'modify';
};

const DailyNormsContent = ({ store, variant }: Props) => {
  const handleNameChange = (value: string) => {
    store.updateCurrentName(value);
  };

  const handleDescriptionChange = (value: string) => {
    store.updateCurrentDescription(value);
  };

  return (
    <div className={styles.container}>
      <div className={styles.basicInfo}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="normName">
            Название
          </label>
          {variant === 'modify' ? (
            <input
              id="normName"
              type="text"
              className={styles.input}
              value={store.current?.name ?? ''}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          ) : (
            <div className={styles.textValue}>{store.current?.name || '—'}</div>
          )}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="normDescription">
            Описание
          </label>
          {variant === 'modify' ? (
            <input
              id="normDescription"
              type="text"
              className={styles.input}
              value={store.current?.description ?? ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
            />
          ) : (
            <div className={styles.textValue}>{store.current?.description || '—'}</div>
          )}
        </div>
      </div>

      <div className={styles.groupsGrid}>
        {nutrientGroups.map((group: NutrientGroup) => (
          <div key={group.name} className={styles.group}>
            <h3 className={styles.groupTitle}>{group.displayName}</h3>
            <div className={styles.groupContent}>
              {group.content.map((nutrient) => (
                <ListItem key={nutrient.id} nutrient={nutrient} store={store} variant={variant} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default observer(DailyNormsContent);
