import React, { useState, useCallback } from "react";
import Notification from "./Notification";
import styles from "./Notification.module.css"
import { UiStore } from "@/store/uiStore/uiStore";
import { uiStore } from "@/store/rootStore";
import { observer } from "mobx-react-lite";



const NotificationWrapper: React.FC = () => {
    const { notification } = uiStore
    const { removeNotification, notifications } = notification

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                {
                    notifications.map(notification => (
                        <Notification
                            notification={notification}
                            key={notification.id}
                            onClose={() => removeNotification(notification.id)}
                        />
                    ))
                }
            </div>
        </div>
    );
};

export default observer(NotificationWrapper);
