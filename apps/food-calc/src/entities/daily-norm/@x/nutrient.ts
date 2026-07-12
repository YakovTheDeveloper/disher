// FSD cross-import public API (`@x`) — единственная санкционированная точка,
// через которую слайс `nutrient` тянет из `daily-norm`. `useNutrientReadout`
// (norm-glue, живёт в entities/nutrient) читает норму юзера отсюда: связь между
// сущностями сделана ЯВНОЙ и минимальной (ровно один символ), а не размазана
// прямыми импортами. См. tds/nutrient-components-reorg-2026-07-11.md, Решение 2.
export { useUserNormItems } from '../api/queries';
