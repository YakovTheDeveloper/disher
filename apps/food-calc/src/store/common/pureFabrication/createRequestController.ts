import { RequestState } from "@/store/shared/RequestState";
import { Instance } from "mobx-state-tree";

export function createRequestController({
    getState,
}: {
    getState: (id: string, variant: string) => Instance<typeof RequestState>;
}) {
    async function run<R>(
        targets:
            | { id: Key; variant: string }
            | Array<{ id: Key; variant: string }>,
        request: () => Promise<R>
    ): Promise<R | null> {
        const list = Array.isArray(targets) ? targets : [targets];

        const states = list.map(t =>
            getState(String(t.id), t.variant)
        );

        states.forEach(s => {
            s?.setLoading(true);
            s?.setError("");
        });

        try {
            const result = await request();
            if (result == null) {
                states.forEach(s => s.setError("not found"));
                return null;
            }
            return result;
        } catch (e) {
            const err = String(e);
            states.forEach(s => s?.setError(err));
            return null;
        } finally {
            states.forEach(s => s?.setLoading(false));
        }
    }

    return { run };
}
