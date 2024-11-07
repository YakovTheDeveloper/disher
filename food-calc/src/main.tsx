import React from 'react'
import * as ReactDOM from "react-dom/client";
import App from './App.tsx'
import './index.css'

import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
} from "react-router-dom";
import "./index.css";
import ProductAdd from './components/blocks/ProductAdd/ProductAdd.tsx';
import ModalRoot from '@/ModalRoot.tsx';
import Header from '@/components/common/Header/Header.tsx';

const Root = () => {
  return (
    <>
      <Header />
      <ModalRoot />
      <Outlet />

    </>
  )
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [{
      path: "",
      element: <App />
    }]
  },
  {
    path: "/add_product",
    element: <ProductAdd />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />
)
