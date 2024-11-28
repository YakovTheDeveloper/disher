import clsx from "clsx";
import React, { FC } from "react";
import s from './Typography.module.css'
type Variant = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "subtitle1" | "subtitle2" | "body1" | "body2" | "caption" | "overline";
type TextAlign = "left" | "center" | "right" | "justify";

interface TypographyProps {
    variant?: Variant;
    component?: React.ElementType;
    color?: string;
    align?: TextAlign;
    className?: string;
    children: React.ReactNode;
}

const variantMapping: Record<Variant, React.ElementType> = {
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    h5: "h5",
    h6: "h6",
    subtitle1: "h6",
    subtitle2: "h6",
    body1: "p",
    body2: "p",
    caption: "span",
    overline: "span",
};

export const Typography: FC<TypographyProps> = ({
    variant = "body1",
    component,
    color,
    align = "left",
    className,
    children,
}) => {
    const Component = component || variantMapping[variant];

    return (
        <Component
            className={clsx([className, s[variant]])}
            style={{
                color,
                textAlign: align,
            }}
        >
            {children}
        </Component>
    );
};
