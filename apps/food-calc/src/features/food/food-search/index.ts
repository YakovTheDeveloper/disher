export { default as SearchFood } from "./SearchFood.tsx";
export { useSearchHeaderContent } from "./useSearchHeaderContent";
// Класс-хост общей рельсы (`--rail-*`) для <ModalShell> — задаёт геометрию, по
// которой хедер (тайтл на рельсе), поле поиска и ряды списка встают на одну
// вертикаль. Живёт на ОБЩЕМ предке хедера и SearchFood.content (см. .railHost).
export { default as searchFoodStyles } from "./SearchFood.module.scss";
