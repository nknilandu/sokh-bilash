import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import Root from "./layouts/Root";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import GiftBoxBuilder from "./pages/GiftBoxBuilder";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import OrderVerifiedPage from "./pages/OrderVerifiedPage";
import OrderRejectedPage from "./pages/OrderRejectedPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import WishlistPage from "./pages/WishlistPage";
import GiftCategoriesPage from "./pages/GiftCategoriesPage";
import ErrorApp from "./pages/error/ErrorApp";
import ErrorPage from "./pages/error/ErrorPage";
import LoadingPage from "./pages/loading/LoadingPage";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    errorElement: <ErrorApp />,
    children: [
      {
        index: true,
        Component: Home,
      },
      {
        path: "shop",
        element: <Shop />,
      },
      {
        path: "/shop/:id",
        element: <ProductDetails />,
      },
      {
        path: "/gift-box",
        element: <GiftBoxBuilder />,
      },
      {
        path: "/cart",
        element: <CartPage />,
      },
      {
        path: "checkout",
        element: <CheckoutPage />,
      },
      {
        path: "order-confirmation/:orderId",
        element: <OrderConfirmationPage />,
      },
      {
        path: "order-verified/:orderId",
        element: <OrderVerifiedPage />,
      },
      {
        path: "order-rejected/:orderId",
        element: <OrderRejectedPage />,
      },
      {
        path: "track-order",
        element: <OrderTrackingPage />,
      },
      {
        path: "track-order/:orderId",
        element: <OrderTrackingPage />,
      },
      {
        path: "wishlist",
        element: <WishlistPage />,
      },
      {
        path: "categories",
        element: <GiftCategoriesPage />,
      },
      {
        path: "*",
        element: <ErrorPage />,
      },
      {
        path: "loading",
        element: <LoadingPage />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
