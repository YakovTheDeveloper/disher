export function getTotalDishFoodContentQuantity(items: { quantity: number }[]) {
    return items.reduce((sum, i) => sum + i.quantity, 0);
}