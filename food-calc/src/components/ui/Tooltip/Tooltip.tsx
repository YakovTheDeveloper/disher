import * as React from "react";
import {
    useFloating,
    autoUpdate,
    offset,
    flip,
    shift,
    useHover,
    useFocus,
    useDismiss,
    useRole,
    useInteractions,
    useMergeRefs,
    FloatingPortal,
    useClick
} from "@floating-ui/react";
import type { Placement } from "@floating-ui/react";
import s from './Tooltip.module.css'

interface TooltipOptions {
    initialOpen?: boolean;
    placement?: Placement;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    isHover?: boolean
    isFocus?: boolean
    isClick?: boolean,
}

export function useTooltip({
    initialOpen = false,
    placement = "top",
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    isHover = false,
    isFocus = false,
    isClick = false
}: TooltipOptions = {}) {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(initialOpen);

    const open = controlledOpen ?? uncontrolledOpen;
    const setOpen = setControlledOpen ?? setUncontrolledOpen;

    const data = useFloating({
        placement,
        open,
        onOpenChange: setOpen,
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(5),
            flip({
                crossAxis: placement.includes("-"),
                fallbackAxisSideDirection: "start",
                padding: 5
            }),
            shift({ padding: 5 })
        ]
    });

    const context = data.context;



    const dismiss = useDismiss(context);
    const role = useRole(context, { role: "tooltip" });

    const interactionItems = [dismiss, role]

    if (isClick) {
        const click = useClick(context);
        interactionItems.push(click)
    }
    if (isHover) {
        const hover = useHover(context, {
            move: false,
            enabled: controlledOpen == null
        });
        interactionItems.push(hover)
    }
    if (isFocus) {
        const focus = useFocus(context, {
            enabled: controlledOpen == null
        });
        interactionItems.push(focus);
    }
    const interactions = useInteractions(interactionItems);


    return React.useMemo(
        () => ({
            open,
            setOpen,
            ...interactions,
            ...data
        }),
        [open, setOpen, interactions, data]
    );
}

type ContextType = ReturnType<typeof useTooltip> | null;

const TooltipContext = React.createContext<ContextType>(null);

export const useTooltipContext = () => {
    const context = React.useContext(TooltipContext);

    if (context == null) {
        throw new Error("Tooltip components must be wrapped in <Tooltip />");
    }

    return context;
};

export function Tooltip({
    children,
    isHover,
    isFocus,
    isClick,
    ...options
}: { children: React.ReactNode } & TooltipOptions) {
    // This can accept any props as options, e.g. `placement`,
    // or other positioning options.
    const tooltip = useTooltip({ ...options, isHover, isFocus, isClick });

    return (
        <TooltipContext.Provider value={tooltip}>
            {children}
        </TooltipContext.Provider>
    );
}

export const TooltipTrigger = React.forwardRef<
    HTMLElement,
    React.HTMLProps<HTMLElement> & { asChild?: boolean }
>(function TooltipTrigger({ children, asChild = false, ...props }, propRef) {
    const context = useTooltipContext();
    const childrenRef = (children as any).ref;
    const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef]);
    // `asChild` allows the user to pass any element as the anchor
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(
            children,
            context.getReferenceProps({
                ref,
                ...props,
                ...children.props,
                "data-state": context.open ? "open" : "closed"
            })
        );
    }

    return (
        <button
            ref={ref}
            // The user can style the trigger based on the state
            data-state={context.open ? "open" : "closed"}
            {...context.getReferenceProps(props)}
        >
            {children}
        </button>
    );
});

export const TooltipContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLProps<HTMLDivElement>
>(function TooltipContent({ style, ...props }, propRef) {
    const context = useTooltipContext();
    const ref = useMergeRefs([context.refs.setFloating, propRef]);

    if (!context.open) return null;

    return (
        <FloatingPortal>
            <div
                ref={ref}
                style={{
                    ...context.floatingStyles,
                    ...style
                }}
                {...context.getFloatingProps(props)}
            />
        </FloatingPortal>
    );
});


export const TooltipInner = ({ children }) => {
    return (
        <div className={s.tooltipInner}>
            {children}
        </div>
    )
}