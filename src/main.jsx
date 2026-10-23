import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import Root from './layouts/Root';
import Home from './pages/Home';

const router = createBrowserRouter([
    {
    path: "/",
    Component: Root,
    // errorElement: <ErrorApp></ErrorApp>,
    children: [
      {
        index: true,
        Component: Home,
      },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
     <RouterProvider router={router} />
  </StrictMode>,
)
