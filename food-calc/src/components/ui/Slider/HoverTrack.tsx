import React, { useRef, useState } from "react";
import s from "./HoverTrack.module.css";
import { debounce } from "@/utils/debounce";

interface HoverTrackProps {
    min: number;
    max: number;
    step: number;
}

const HoverTrack: React.FC<HoverTrackProps> = ({ min, max, step }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [hoverPercentage, setHoverPercentage] = useState(0);
    const [previewValue, setPreviewValue] = useState<number | null>(null);


    const calculateValue = (percentage: number) => {
        const newValue = min + (percentage / 100) * (max - min);
        return Math.round(newValue / step) * step;
    };


    const onHover = (percentage: number | null) => {
        setPreviewValue(percentage !== null ? calculateValue(percentage) : null)
    }


    const calculatePercentage = (clientX: number) => {
        if (!ref.current) return 0;
        const { left, width } = ref.current.getBoundingClientRect();
        const percentage = Math.min(Math.max((clientX - left) / width, 0), 1) * 100;
        return percentage;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const newHoverPercentage = calculatePercentage(e.clientX);
        setHoverPercentage(newHoverPercentage);
        onHover(newHoverPercentage);
    }


    // const handleMouseMove = (e: React.MouseEvent) => {



    //     const newHoverPercentage = calculatePercentage(e.clientX);
    //     setHoverPercentage(newHoverPercentage);
    //     onHover(newHoverPercentage);
    // };

    const handleMouseLeave = () => {
        setHoverPercentage(0);
        onHover(null);
    };

    return (
        <div
            ref={ref}
            className={s.hoverTrackContainer}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >

            <div
                className={s.hoverTrack}
                style={{
                    width: `${hoverPercentage}%`,
                }}
            ></div>
            {previewValue !== null && (
                <span
                    className={s.previewValue}
                    style={{
                        left: `${hoverPercentage}%`,
                    }}
                >
                    {previewValue.toFixed()} {/* Customize the display format */}

                </span>
            )}
        </div>
    );
};

export default HoverTrack;
