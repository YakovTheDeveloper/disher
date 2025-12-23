export const formatDDMMYYYY = (date: Date): string => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();

    return `${dd}-${mm}-${yyyy}`;
};

export const parseDDMMYYYY = (value: string): Date => {
    const [dd, mm, yyyy] = value.split('-').map(Number);
    return new Date(yyyy, mm - 1, dd);
};