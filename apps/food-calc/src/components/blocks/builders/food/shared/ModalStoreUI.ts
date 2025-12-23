// ModalStoreUI.ts
export class ModalStoreUI<Variants extends string | number> {
    private navigate: ReturnType<typeof import("react-router").useNavigate> | null = null;

    setNavigate = (navigate: ReturnType<typeof import("react-router").useNavigate>) => {
        this.navigate = navigate;
    };

    set = (
        value: Variants | null,
        inputParams?: Record<string, string>,
        removeParams?: string[]
    ) => {
        if (!value || !this.navigate) return;

        const params = new URLSearchParams(window.location.search);

        // удалить ненужные параметры

        params.set("modal", value.toString());

        if (inputParams) {
            Object.entries(inputParams).forEach(([key, val]) => {
                params.set(key, val);
            });
        }

        removeParams?.forEach((key) => {
            params.delete(key);
        });

        this.navigate(`?${params.toString()}`, {
            replace: false,
            state: { modal: true },
        });
    };

    close = () => {
        window.history.back()
    };

    clear = () => {
        window.history.back()
    };
}
