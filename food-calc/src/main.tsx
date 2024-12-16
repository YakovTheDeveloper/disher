/* eslint-disable linebreak-style */

import * as ReactDOM from "react-dom/client";

import CreateDish from "./components/blocks/CreateDish/CreateDish.tsx";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./index.css";

import ProductAdd from "./components/blocks/ProductAdd/ProductAdd.tsx";



import Days from "@/components/blocks/Days/Days.tsx";


import DailyNorms from "@/components/blocks/DailyNorms/DailyNorms.tsx";
import DaysCalendar from "@/components/blocks/DaysCalendar/DaysCalendar.tsx";
import Root from "@/Root.tsx";

export const RouterPaths = {
  main: {
    url: "/",
    label: "Блюда",
  },
  days: {
    url: "/days",
    label: "Дни",
  },
  norm: {
    url: "/daily-norms",
    label: "Нормы",
  },
};

const router = createBrowserRouter([
  {
    path: "/",

    element: <Root />,

    children: [
      {
        path: "",

        element: <CreateDish />,
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

      {
        path: "/calendar",

        element: <DaysCalendar />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);
