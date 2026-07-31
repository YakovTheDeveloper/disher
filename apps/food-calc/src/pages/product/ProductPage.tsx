import { useMemo, useRef, useState, type FocusEvent } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  useProduct,
  useProductPortions,
  useProductNutrients,
  setProductNutrients,
  setProductPortions,
  updateProduct,
  deleteProducts,
} from '@/entities/product';
import { allNutrientsList } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { NutrientTotals } from '@/entities/nutrient/ui/NutrientTotals';
import { NormLegendButton } from '@/features/dailyNorms/NormLegendButton';
import {
  ChangeNameModal,
  CHANGE_NAME_INPUT_ID,
  ChangeDescriptionModal,
  CHANGE_DESCRIPTION_INPUT_ID,
} from '@/features/shared/change-name';
import { ItemActionsDrawer } from '@/features/shared/item-actions-drawer';
import { EntityEditDrawer } from '@/features/shared/entity-edit-drawer';
import { ProductHubDrawer } from '@/features/product-analysis';
// Прямой импорт файлов product-drawer (не barrel): переиспользуем AI-подбор
// состава + confirm-дровер + модалку ручного ввода, не втягивая сам ProductDrawer.
import { SuggestNutrientsConfirmDrawer } from '@/features/food/product-drawer/SuggestNutrientsConfirmDrawer';
import { suggestProductNutrients } from '@/features/food/product-drawer/suggestProductNutrients';
import { EditNutrientsModal } from '@/features/food/product-drawer/EditNutrientsModal';
import { EntityPageShell } from '@/widgets/EntityPageShell';
import { SuggestActionButton } from '@/shared/ui/SuggestActionButton';
import { EmptyState } from '@/shared/ui/EmptyState';
import { IconButton } from '@/shared/ui/atoms/Button';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';
import { Text } from '@/shared/ui/atoms/Typography';
import { drawerStore } from '@/shared/ui/drawer-store';
import { modalStore } from '@/shared/ui/modal-store';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { isCreatedByUser } from '@/shared/lib';
import { safeMutate } from '@/shared/lib/safeMutate';
import { markAdded } from '@/shared/model/recentlyAddedStore';
import { formatAmount } from '@/shared/lib/formatNumber';
import toaster from '@/shared/lib/toaster/toaster';
import { classifyError, defaultUserMessage } from '@/shared/lib/errors/classify';
import EditIcon from '@/shared/assets/icons/edit.svg?react';
import styles from './ProductPage.module.scss';

const gramNutrientIds = new Set(allNutrientsList.filter((n) => n.unit === 'g').map((n) => n.id));

type Portion = { label: string; grams: number };

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    console.error('Product ID is required but not found in URL');
    return null;
  }

  // id-guard в обёртке (до return — только useParams). Тело с хуками — в Inner
  // с гарантированным id: string (react-hooks/rules-of-hooks), 1:1 с DishBuilderPage.
  return <ProductPageInner id={id} />;
};

const ProductPageInner = ({ id }: { id: string }) => {
  const { t } = useTranslation();
  const food = useProduct(id);
  const portionsRaw = useProductPortions(id);
  const { results: nutrientsRaw } = useProductNutrients(id);

  const navigate = useNavigate();
  const location = useLocation();

  const [renameOpen, setRenameOpen] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  // X-Request-Id для оплаты подбора: чеканится один раз, ПЕРЕИСПОЛЬЗУЕТСЯ на
  // ретраях того же продукта (потерянный ответ иначе двойным списанием 0.5 ₽);
  // сбрасывается на успехе. Хук ДО guard `if (!food)` (rules-of-hooks).
  const suggestRequestIdRef = useRef<string | null>(null);

  const handleChromeFocusCapture = (e: FocusEvent) => {
    const focusedId = (e.target as HTMLElement).id;
    if (focusedId === CHANGE_NAME_INPUT_ID) setRenameOpen(true);
    else if (focusedId === CHANGE_DESCRIPTION_INPUT_ID) setDescriptionOpen(true);
  };

  const nutrientValueMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of nutrientsRaw) map.set(n.nutrientId, n.quantity);
    return map;
  }, [nutrientsRaw]);

  const totalGramMass = useMemo(() => {
    let sum = 0;
    for (const [nutrientId, qty] of nutrientValueMap) {
      if (gramNutrientIds.has(nutrientId)) sum += qty;
    }
    return sum;
  }, [nutrientValueMap]);

  // Back-origin (state.from) + мгновенное имя (state.heroName) — оба кладёт
  // быстрый дровер при «Открыть страницу» (viewTransition state).
  const navState = location.state as { from?: string; heroName?: string } | null;
  const backFrom = navState?.from;
  const heroName = navState?.heroName;

  // Пока продукт грузится из Dexie (useProduct отдаёт undefined первым тиком) —
  // рисуем каркас с мгновенным именем из nav-state вместо чёрного экрана. Тот же
  // <EntityPageShell> в той же позиции дерева → реконсиляция, без ремоунта дека;
  // как только продукт подгрузится, ниже отрисуется полный экран. Без heroName
  // (переход не из дровера) поведение прежнее — null до загрузки.
  if (!food) {
    return heroName ? (
      <EntityPageShell
        entityLabel="Продукт"
        backFrom={backFrom}
        nameHeading={
          <Heading role="title" as="h2" className={styles.nameHeading}>
            <span>{heroName}</span>
          </Heading>
        }
        firstSlideBody={null}
      />
    ) : null;
  }

  const isUserCreated = isCreatedByUser(food.id);
  const isSupplement = food.servingBasis === 'serving';
  const getNutrientValue = (nutrientId: string) => nutrientValueMap.get(nutrientId) ?? 0;

  const massExceeds100 = totalGramMass > 100;
  const massWarningGrams =
    isUserCreated && food.servingBasis === '100g' && massExceeds100 ? totalGramMass : null;

  // Ручной ввод состава — fullscreen-модалка через modalStore (2026-07-29:
  // инлайн-редактор уехал со страницы). AI-переподбор живёт внутри неё же;
  // draft+confirm, massWarning и спиннер подбора модалка считает сама.
  const openEditNutrients = () => {
    void modalStore.show(EditNutrientsModal, {
      productId: food.id,
      onResuggest: () => runSuggest(nutrientValueMap.size > 0),
    });
  };

  // Карандаш в хедере → нижний дровер действий (замена DropdownMenu-поповера,
  // 2026-07-29). trapFocus:false — ряды названия/описания делегируют фокус
  // инпутам chrome-модалок ВНЕ портала дровера (iOS focus-канон).
  const openEditDrawer = () => {
    void drawerStore.show(
      EntityEditDrawer,
      {
        title: food.name,
        nameInputId: CHANGE_NAME_INPUT_ID,
        descriptionInputId: CHANGE_DESCRIPTION_INPUT_ID,
        onEditNutrients: openEditNutrients,
        onDelete: () => void handleDeleteProduct(),
        deleteLabel: 'Удалить продукт',
      },
      { trapFocus: false }
    );
  };

  // «Предложить нутриенты»: AI оценивает полный профиль на 100 г по имени →
  // whole-replace. Платный запрос (402 → тост). confirm=true (состав уже есть) —
  // деструктивный overwrite за confirm-дровером; confirm=false (пусто) — сразу.
  const runSuggest = async (confirm: boolean) => {
    if (confirm) {
      const proceed = await drawerStore.show(SuggestNutrientsConfirmDrawer, {});
      if (!proceed) return;
    }
    setSuggesting(true);
    const requestId = (suggestRequestIdRef.current ??= crypto.randomUUID());
    try {
      const record = await suggestProductNutrients(food.name, requestId);
      // Пустой результат — завершённый (оплаченный) прогон, не потеря ответа:
      // не затираем прошлый состав `{}`, сбрасываем id (следующий тап — новый
      // billable-запрос), сообщаем об ошибке.
      if (Object.keys(record).length === 0) {
        suggestRequestIdRef.current = null;
        toaster.error('Не удалось подобрать состав, попробуй ещё раз');
        return;
      }
      await setProductNutrients(food.id, JSON.stringify(record));
      suggestRequestIdRef.current = null;
      toaster.success('Состав обновлён');
    } catch (e) {
      const kind = classifyError(e);
      toaster.error(defaultUserMessage(kind), { kind });
    } finally {
      setSuggesting(false);
    }
  };

  const handleDeleteProduct = async () => {
    const confirmed = await modalStore.show(ConfirmModal, {
      title: 'Удалить продукт?',
      message: 'Продукт будет удалён из ваших продуктов. Это действие не отменить.',
      confirmLabel: 'Удалить',
      tone: 'danger',
    });
    if (confirmed !== true) return;
    const res = await safeMutate(() => deleteProducts([food.id]), 'Не удалось удалить продукт');
    if (res.ok) {
      setRenameOpen(false);
      // После удаления useProduct(id) вернёт null и страница отдаст null —
      // навигируем сами, иначе остался бы пустой экран.
      navigate(backFrom ?? '/food');
    }
  };

  // ── Порции продукта: JSON-blob whole-array replace (нет отдельной таблицы) ──
  const createPortion = (portion: Portion) => {
    const updated = [...portionsRaw, portion];
    void safeMutate(
      () => setProductPortions(food.id, JSON.stringify(updated)),
      'Не удалось добавить порцию'
    ).then((res) => {
      if (res.ok) markAdded([portion.label]);
    });
  };
  const updatePortion = (label: string, updates: Partial<Portion>) => {
    const updated = portionsRaw.map((p) => (p.label === label ? { ...p, ...updates } : p));
    void safeMutate(
      () => setProductPortions(food.id, JSON.stringify(updated)),
      'Не удалось обновить порцию'
    );
  };
  const deletePortion = (label: string) => {
    const updated = portionsRaw.filter((p) => p.label !== label);
    void safeMutate(
      () => setProductPortions(food.id, JSON.stringify(updated)),
      'Не удалось удалить порцию'
    );
  };
  const openPortionDeleteDrawer = (label: string) => {
    void drawerStore.show(ItemActionsDrawer, {
      title: label || 'Порция',
      onDelete: () => deletePortion(label),
    });
  };

  // «О!»-хаб (свой продукт): единственный ряд «Найти нутриенты» → тот же AI-подбор.
  const openProductHub = () => {
    void drawerStore.show(ProductHubDrawer, {
      onSuggest: () => void runSuggest(nutrientValueMap.size > 0),
      suggestDisabled: suggesting || !food.name.trim(),
    });
  };

  // Имя продукта в topContent. Свой продукт — кликабельный rename-label (как
  // блюдо); каталожный — простой heading (переименование запрещено).
  const nameHeading = isUserCreated ? (
    <Heading role="title" as="h2" className={styles.nameHeading}>
      <label htmlFor={CHANGE_NAME_INPUT_ID} aria-label="Изменить название">
        <span>{food.name}</span>
      </label>
    </Heading>
  ) : (
    <Heading role="title" as="h2" className={styles.nameHeading}>
      <span>{food.name}</span>
    </Heading>
  );

  // Карандаш правки — только свой продукт (каталог read-only). Открывает нижний
  // дровер действий (EntityEditDrawer): название/описание — label-делегация на
  // chrome-модалки, нутриенты — modalStore, удаление — confirm.
  const editMenu = isUserCreated ? (
    <IconButton
      className={styles.editIconBtn}
      aria-label="Редактировать продукт"
      onClick={openEditDrawer}
      icon={<EditIcon width={20} height={20} />}
    />
  ) : undefined;

  const descriptionBlock = food.description ? (
    <Text as="p" role="body" className={styles.description}>
      {food.description}
    </Text>
  ) : null;

  // Тело первого слайда: read-only витрина `NutrientTotals` (та же, что в
  // дровере «Пищевая ценность» / на HomePage, 2026-07-29) для своего и
  // каталожного продукта; правка состава — в EditNutrientsModal. Свой продукт
  // с пустым составом — empty-state с AI-подбором и ручным вводом.
  const basisBadge = (
    <Text as="span" role="caption">
      {isSupplement ? 'за порцию' : 'на 100 г'}
    </Text>
  );

  let firstSlideBody;
  if (!isUserCreated) {
    firstSlideBody = (
      <div className={styles.body}>
        <NutrientTotals getValue={getNutrientValue} normControl={<NormLegendButton />}>
          {basisBadge}
        </NutrientTotals>
        {descriptionBlock}
      </div>
    );
  } else if (nutrientValueMap.size === 0) {
    firstSlideBody = (
      <div className={styles.body}>
        {descriptionBlock}
        <EmptyState
          className={styles.emptyNutrients}
          title={t('food.product.emptyComposition')}
          action={
            <>
              <SuggestActionButton
                label={suggesting ? 'Подбираем…' : 'Предложить нутриенты'}
                onClick={() => void runSuggest(false)}
                disabled={suggesting || !food.name.trim()}
              />
              <button type="button" className={styles.manualLink} onClick={openEditNutrients}>
                <Text as="span" role="caption">
                  Ввести вручную
                </Text>
              </button>
            </>
          }
        />
      </div>
    );
  } else {
    firstSlideBody = (
      <div className={styles.body}>
        <div className={styles.suggestRow}>
          <SuggestActionButton
            label={suggesting ? 'Подбираем…' : 'Переподобрать состав'}
            onClick={() => void runSuggest(true)}
            disabled={suggesting || !food.name.trim()}
          />
        </div>
        {massWarningGrams != null && (
          <p className={styles.massWarning} role="status">
            <Text as="span" role="caption">
              Совокупная масса нутриентов ({formatAmount(massWarningGrams)} г) превышает 100 г
            </Text>
          </p>
        )}
        <NutrientTotals getValue={getNutrientValue} normControl={<NormLegendButton />}>
          {basisBadge}
        </NutrientTotals>
        {descriptionBlock}
      </div>
    );
  }

  const chrome = isUserCreated ? (
    <>
      <ChangeNameModal
        currentName={food.name}
        isExpanded={renameOpen}
        onClose={() => setRenameOpen(false)}
        onChangeName={(name) => {
          void safeMutate(() => updateProduct(food.id, { name }), 'Не удалось переименовать');
          setRenameOpen(false);
        }}
        onDelete={handleDeleteProduct}
        deleteLabel="Удалить продукт"
      />
      <ChangeDescriptionModal
        currentDescription={food.description}
        isExpanded={descriptionOpen}
        onClose={() => setDescriptionOpen(false)}
        onChangeDescription={(description) => {
          void safeMutate(
            () => updateProduct(food.id, { description }),
            'Не удалось изменить описание'
          );
          setDescriptionOpen(false);
        }}
      />
    </>
  ) : undefined;

  // Порции — только свой продукт-еда (каталог read-only, БАД без порций).
  const showPortions = isUserCreated && !isSupplement;

  return (
    <EntityPageShell
      entityLabel="Продукт"
      backFrom={backFrom}
      hub={
        isUserCreated
          ? { onClick: openProductHub, ariaLabel: 'Действия с продуктом — подбор нутриентов' }
          : undefined
      }
      nameHeading={nameHeading}
      editMenu={editMenu}
      firstSlideBody={firstSlideBody}
      portions={
        showPortions
          ? {
              rows: portionsRaw.map((p) => ({ label: p.label, grams: p.grams })),
              existingLabels: portionsRaw.map((p) => p.label),
              unit: 'г',
              onCreate: createPortion,
              onUpdate: updatePortion,
              onLongPressRow: openPortionDeleteDrawer,
            }
          : undefined
      }
      chrome={chrome}
      onChromeFocusCapture={handleChromeFocusCapture}
    />
  );
};

export default ProductPage;
