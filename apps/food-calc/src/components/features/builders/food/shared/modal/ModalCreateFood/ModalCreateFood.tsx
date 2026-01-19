import { observer } from 'mobx-react-lite';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ModalCreateFood.module.scss';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import { TextInput } from '@/components/ui/atoms/input/TextInput';
import { Label } from '@/components/features/builders/food/ScheduleBuilder/EventsBuilder/components/EventContent/shared/Label';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { Button } from '@/components/ui/Button';
import { domainStore } from '@/store/store';
import { RouterLinks } from '@/router';
import { DrawerStoreInstance } from '@/store/GlobalUiStore/DrawerStore/DrawerStore';
import { productFactory } from '@/domain/product/Food.factory';
type Props = {
  modalStore: ModalStoreInstance;
  drawerStore: DrawerStoreInstance;
};

const ModalCreateFood = ({
  modalStore,
  drawerStore = domainStore.globalUiStore.drawerStore,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleCreate = () => {
    const name = inputRef.current?.value.trim();
    if (!name) return;

    const createdFood = domainStore.foodStore.user.insert(
      productFactory.createNewLocal({
        name,
        createdByUser: true,
      })
    );
    modalStore.closeModal();
    drawerStore.close();
    if (!createdFood) return;
    navigate(`${RouterLinks.UserProduct}/${createdFood.id}`);
  };

  return (
    <div className={styles.container} onClick={(e) => e.stopPropagation()}>
      <p>Создать новый продукт</p>
      <Label aside={<ScreenLabel variant="formValueLabel">Создать</ScreenLabel>}>
        <TextInput ref={inputRef} placeholder="Например, креветка" />
      </Label>
      <Button onClick={handleCreate}>Создать</Button>
    </div>
  );
};

export default observer(ModalCreateFood);
