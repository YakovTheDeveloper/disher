shared/commonStyles.module.scss - содержит общие стили для фичей
shared/FilterListLayout - все фичи используют этот компонент как layout
shared/hooks/useListStateActions - хук для действий на странице
shared/hooks/useScrollToTop - хук для скролла наверх (появляется/исчезает при пролистывании одного экрана вниз и соответствующем направлении скролла)

Каждая фича списка должна реализовывать:
-FilterPanel
-SearchInput
-FilterListLayout
-2 кнопки в ActionsPanel (кнопка скролла наверх, кнопка добавления сущности)
