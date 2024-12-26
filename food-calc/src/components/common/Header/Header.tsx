import AuthButton from "@/components/ui/Button/AuthButton/AuthButton";
import { uiStore, userStore } from "@/store/rootStore";
import { UserStore } from "@/store/userStore/userStore";
import React from "react";
import s from "./Header.module.css";
import { RouterPaths } from "@/main";
import { NavLink } from "react-router-dom";
import { Typography } from "@/components/ui/Typography/Typography";
import { Modals } from "@/store/uiStore/modalStore/modalStore";
import DishIcon from "@/assets/icons/dish.svg"; // Adjust the path as needed
import { observer } from "mobx-react-lite";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip/Tooltip";

const Header = () => {
  const { user } = userStore;

  return (
    <header className={s.header}>
      <div className={s.inner}>

        {/* <LogoIcon className={s.logo} /> */}

        <nav className={s.navigation}>
          {Object.values(RouterPaths).map(({ label, url, Icon }) => (
            <NavLink
              to={url}
              className={({ isActive }) => (isActive ? `${s.link} ${s.activeLink}` : s.link)}
            >
              <Tooltip isHover isFocus={false}>
                <TooltipTrigger >
                  <Typography>
                    {<Icon className={s.icon} />}
                  </Typography>
                </TooltipTrigger>
                <TooltipContent>
                  {label}
                </TooltipContent>
              </Tooltip>

            </NavLink>
          ))}
        </nav>
        <div className={s.auth}>
          <AuthButton />
          {/* <div>{user?.login}</div> */}
        </div>
      </div>
    </header>
  );
};

export default observer(Header);
