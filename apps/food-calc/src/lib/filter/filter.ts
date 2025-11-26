export function filterBy(
    items: any[] | undefined,
    query: string,
    fields: string[]
) {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) =>
        fields.some((field) =>
            ((item[field] ?? '') + '').toLowerCase().includes(q)
        )
    );
}
