import { observer } from 'mobx-react-lite';
import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { useDailyNorms, createDailyNorm } from '@/entities/daily-norm';
import { RouterLinks } from '@/router';
import styles from './dailyNormsPage.module.scss';
import SearchInput from '@/shared/ui/atoms/input/SearchInput/SearchInput';
import { Screen } from '@/shared/ui/Screen';
import AddButton from '@/shared/ui/atoms/Button/AddButton/AddButton';
import { ListItem } from '@/shared/ui/list-item/ListItem';
import TickIcon from '@icons/tick.svg';
import { useNavigate } from 'react-router';
import TextBehind from '@/shared/ui/TextBehind/TextBehind';
import normsImg from '@/assets/decarative/norms.png';
import commonStyles from '@/features/lists/shared/commonStyles.module.scss';

type Props = {
  children?: React.ReactNode;
};

const SelectButton = ({ isSelected, onSelect }: { isSelected: boolean; onSelect: () => void }) => (
  <button
    type="button"
    className={clsx(styles.selectBtn, isSelected && styles.selectBtn_active)}
    onClick={(e) => {
      e.stopPropagation();
      onSelect();
    }}
  >
    <AnimatePresence mode="wait">
      {isSelected && (
        <motion.span
          key="tick"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 90 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className={styles.tickWrap}
        >
          <TickIcon />
        </motion.span>
      )}
    </AnimatePresence>
  </button>
);

const DailyNormsPage = ({ children: _children }: Props) => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [selectedNormId, setSelectedNormId] = useState<string | null>(null);
  const { results: norms } = useDailyNorms();

  const normList = useMemo(() => {
    if (!norms) return [];
    const all = Array.from(norms.values());
    if (!searchText) return all;
    const lower = searchText.toLowerCase();
    return all.filter(
      (n) => n.name?.toLowerCase().includes(lower) || n.description?.toLowerCase().includes(lower)
    );
  }, [norms, searchText]);

  const onAdd = async () => {
    const id = await createDailyNorm('Новая норма', '');
    navigate(`${RouterLinks.DailyNorms}/${id}`);
  };

  return (
    <Screen offsetTop bottomRight={<AddButton onClick={onAdd} />} actions={<></>}>
      <div className={styles.content}>
        <TextBehind text="Нормы" position="middle-left">
          <SearchInput
            size="medium"
            wrapperClassName={commonStyles.searchWrapper}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </TextBehind>
        <ul className={styles.list}>
          <div className={styles.decorImg}>
            <img src={normsImg} alt="" />
          </div>
          <AnimatePresence initial={false}>
            {normList.map((item, i) => {
              const isSelected = selectedNormId === item.id;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28, delay: i * 0.03 }}
                >
                  <ListItem
                    active={isSelected}
                    onClick={() => navigate(`${RouterLinks.DailyNorms}/${item.id}`)}
                    before={
                      <SelectButton
                        isSelected={isSelected}
                        onSelect={() => setSelectedNormId(item.id)}
                      />
                    }
                  >
                    {item.name || 'без имени'}
                  </ListItem>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>
    </Screen>
  );
};

export default observer(DailyNormsPage);
