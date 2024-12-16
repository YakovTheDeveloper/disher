import AuthButton from "@/components/ui/Button/AuthButton/AuthButton";
import { uiStore, userStore } from "@/store/rootStore";
import { UserStore } from "@/store/userStore/userStore";
import React from "react";
import s from "./Header.module.css";
import { RouterPaths } from "@/main";
import { NavLink } from "react-router-dom";
import { Typography } from "@/components/ui/Typography/Typography";
import { Modals } from "@/store/uiStore/modalStore/modalStore";

const Header = () => {
  const { modal } = uiStore;
  const { user } = userStore;

  const onSignIn = () => modal.openModal(Modals.Auth);

  return (
    <header className={s.header}>
      <div className={s.inner}>
        <nav className={s.navigation}>
          {Object.values(RouterPaths).map(({ label, url }) => (
            <NavLink
              to={url}
              className={({ isActive }) => (isActive ? `${s.link} ${s.activeLink}` : s.link)}
            >
              <Typography>{label}</Typography>
            </NavLink>
          ))}
        </nav>
        <div className={s.auth}>
          <AuthButton onClick={onSignIn}>Войти</AuthButton>
          <div>{user?.login}</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
