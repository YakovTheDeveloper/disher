/**
 * Drawer types for V2 - simplified with code splitting support
 */

export interface DrawerProps<TPayload = unknown> {
    payload: TPayload;
    onClose: () => void;
}

export type LazyDrawerComponent<TPayload = unknown> = React.ComponentType<DrawerProps<TPayload>>;

export interface DrawerConfig<TPayload = unknown> {
    component: LazyDrawerComponent<TPayload>;
    payloadSchema?: unknown;
}

export interface DrawerRegistryEntry<TPayload = unknown> {
    loader: () => Promise<{ default: LazyDrawerComponent<TPayload> }>;
    config?: DrawerConfig<TPayload>;
}

export interface ActiveDrawerState {
    type: string;
    payload?: unknown;
}

export type DrawerOpenArgs<TPayload = unknown> = {
    type: string;
    payload?: TPayload;
};