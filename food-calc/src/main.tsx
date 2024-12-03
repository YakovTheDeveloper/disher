/* eslint-disable linebreak-style */
import React from "react";

import * as ReactDOM from "react-dom/client";

import App from "./App.tsx";

import "./index.css";

import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";

import "./index.css";

import ProductAdd from "./components/blocks/ProductAdd/ProductAdd.tsx";

import ModalRoot from "@/ModalRoot.tsx";

import Header from "@/components/common/Header/Header.tsx";

import Days from "@/components/blocks/Days/Days.tsx";

import AddDishToDay from "@/components/blocks/Days/AddDishToDay/AddDishToDay.tsx";

import DailyNorms from "@/components/blocks/DailyNorms/DailyNorms.tsx";

const Root = () => {
  return (
    <>
      <Header />

      <ModalRoot />

      <Outlet />
    </>
  );
};

export const RouterPaths = {

  main: {
    url: "/",

    label: "Создание блюд",
  },
  days: {
    url: "/days",

    label: "Дни",
  },

  norm: {
    url: "/daily-norms",

    label: "Дневные нормы",
  },
};

const router = createBrowserRouter([
  {
    path: "/",

    element: <Root />,

    children: [
      {
        path: "",

        element: <App />,
      },
      {
        path: "/add_product",

        element: <ProductAdd />,
      },

      {
        path: "/days",

        element: <Days />,
      },

      {
        path: "/daily-norms",

        element: <DailyNorms />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);
