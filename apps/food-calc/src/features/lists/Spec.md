src\components\features\builders\shared\ui\layout\Screen\Screen.tsx - основной контейнер
shared/commonStyles.module.scss - содержит общие стили для фичей
shared/FilterListLayout - все фичи используют этот компонент как layout в качестве children у Screen
shared/hooks/useListStateActions - хук для действий на странице

Каждая фича списка должна реализовывать:
-Screen
-FilterPanel
-SearchInput
-FilterListLayout
