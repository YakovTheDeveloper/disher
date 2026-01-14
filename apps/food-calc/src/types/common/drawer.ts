export interface DrawerContext<TPayload = unknown> {
    payload: TPayload;
    close: () => void;
}

export interface DrawerDefinition<TPayload = unknown> {
    type: DrawerType;
    render: (ctx: DrawerContext<TPayload>) => React.ReactNode;
}

export type DrawerType = string;
