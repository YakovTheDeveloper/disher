// Общие типы для фильтрации по категориям
export interface CategoryGroup<T extends string = string> {
  groupName: string;
  categories: T[];
  icon?: string;
}

export interface CategoryOption<T extends string = string> {
  value: T;
  label: string;
  popularity?: number;
}
