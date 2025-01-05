/* eslint-disable linebreak-style */

import * as ReactDOM from "react-dom/client";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./index.css";

import ProductAdd from "./components/blocks/ProductAdd/ProductAdd.tsx";



import Days from "@/components/blocks/Days/Days.tsx";
import DishIcon from "@/assets/icons/dish.svg"
import DaysIcon from "@/assets/icons/days.svg"

import DailyNorms from "@/components/blocks/DailyNorms/DailyNorms.tsx";
import DaysCalendar from "@/components/blocks/DaysCalendar/DaysCalendar.tsx";
import Root from "@/Root.tsx";
import Dishes from "@/components/blocks/Dish/Dishes.tsx";
import ProductsPage from "@/components/blocks/Products/ProductsPage.tsx";

export const RouterPaths = {
  main: {
    url: "/",
    label: "Блюда",
    Icon: DishIcon
  },
  days: {
    url: "/days",
    label: "Дни",
    Icon: DaysIcon

  },
  norm: {
    url: "/daily-norms",
    label: "Нормы",
    Icon: DishIcon
  },
};

const router = createBrowserRouter([
  {
    path: "/",

    element: <Root />,

    children: [
      {
        path: "",

        element: <Dishes />,
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
      {
        path: '/products',
        element: <ProductsPage />
      }
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);
