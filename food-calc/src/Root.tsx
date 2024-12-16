import Header from "@/components/common/Header/Header";
import NotificationWrapper from "@/components/ui/Notification/NotificationWrapper";
import ModalRoot from "@/ModalRoot";
import { Outlet } from "react-router";
import s from './Root.module.css'

const Root = () => {
    return (
        <div className={s.root}>
            <Header />
            <ModalRoot />
            <NotificationWrapper />
            <div className={s.main}>
                <Outlet />
            </div>
        </div>
    );
};

export default (Root)