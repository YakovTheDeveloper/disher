import React, { useEffect } from "react";
import styles from "./Notification.module.css";
import { NotificationData } from "@/store/uiStore/uiStore";
import { observer } from "mobx-react-lite";
import RemoveButton from "@/components/ui/RemoveButton/RemoveButton";
import { s } from "framer-motion/client";


interface NotificationProps {
    notification: NotificationData;
    duration?: number; // Duration in milliseconds, default is 3000ms
    onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({
    notification,
    duration = 3000,
    onClose,
}) => {


    const { message, variant } = notification

    return (
        <div className={`${styles.notification} ${styles[variant]}`}>
            <div className={styles.removeButtonPosition}>
                <RemoveButton onClick={onClose} size="small" color="white" />
            </div>
            <p>{message}</p>
        </div>
    );
};

export default observer(Notification);
