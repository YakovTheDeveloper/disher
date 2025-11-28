// ModalStoreUI.ts
export class ModalStoreUI<Variants extends string | number> {
    private navigate: ReturnType<typeof import("react-router").useNavigate> | null = null;

    setNavigate = (navigate: ReturnType<typeof import("react-router").useNavigate>) => {
        this.navigate = navigate;
    };

    set = (value: Variants | null) => {
        if (!value || !this.navigate) return;
        const params = new URLSearchParams(window.location.search);
        params.set("modal", value.toString());
        this.navigate(`?${params.toString()}`, { replace: false, state: { modal: true } });
    };

    close = () => {
        window.history.back()
    };

    clear = () => {
        window.history.back()
    };
}
