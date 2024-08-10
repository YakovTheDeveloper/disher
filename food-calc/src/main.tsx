import React from 'react'
import * as ReactDOM from "react-dom/client";
import App from './App.tsx'
import './index.css'
import { ChakraProvider } from '@chakra-ui/react'

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import "./index.css";
import ProductAdd from './components/blocks/ProductAdd/ProductAdd.tsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/add_product",
    element: <ProductAdd />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ChakraProvider>
    <RouterProvider router={router} />
  </ChakraProvider>
)
