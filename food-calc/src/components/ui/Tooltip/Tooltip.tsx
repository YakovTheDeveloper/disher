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
import clsx from "clsx";

interface TooltipOptions {
    initialOpen?: boolean;
    placement?: Placement;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    isDismiss?: boolean
    isHover?: boolean
    isFocus?: boolean
    isClick?: boolean,
}

export function useTooltip({
    initialOpen = false,
    placement = "top",
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    isDismiss = true,
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
            offset(3),
            flip({
                crossAxis: placement.includes("-"),
                fallbackAxisSideDirection: "start",
                padding: 5
            }),
            shift({ padding: 5 })
        ]
    });

    const context = data.context;



    const role = useRole(context, { role: "tooltip" });

    const interactionItems = [role]

    const dismiss = useDismiss(context, {
        enabled: true
    });
    interactionItems.push(dismiss)

    if (isClick) {
        const click = useClick(context);
        interactionItems.push(click)
    }
    if (isHover) {
        const hover = useHover(context, {
            move: true,
            delay: 50,
            enabled: controlledOpen == null,
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
    isDismiss,
    isClick,
    ...options
}: { children: React.ReactNode } & TooltipOptions) {
    // This can accept any props as options, e.g. `placement`,
    // or other positioning options.
    const tooltip = useTooltip({ ...options, isHover, isFocus, isClick, isDismiss });


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
                className="Tooltip"
                ref={ref}
                style={{
                    // zIndex: 1000,
                    ...context.floatingStyles,
                    ...style
                }}
                {...context.getFloatingProps(props)}
            />
        </FloatingPortal>
    );
});


type TooltipInnerProps = {
    children: React.ReactNode
    size?: 'small' | 'medium'
    className?: string
    variant?: 'simple' | 'standard'
}

export const TooltipInner = ({ children, className, size = "small", variant = 'standard' }: TooltipInnerProps) => {
    return (
        <div className={clsx([s.tooltipInner, className, s[size], s[variant]])}>
            {children}
        </div>
    )
}