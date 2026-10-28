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
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminOrderDetailsPage from "./pages/admin/AdminOrderDetailsPage";
import PaymentVerificationPage from "./pages/admin/PaymentVerificationPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminProductFormPage from "./pages/admin/AdminProductFormPage";
import Login from "./pages/auth/Login";
import AuthLayout from "./layouts/AuthLayout";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import AdminLayout from "./layouts/AdminLayout";

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
    ],
  },
  {
    path: "/",
    element: <AuthLayout />,
    children: [
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "forgot-password", element: <ForgotPassword /> },
    ],
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    // Add your existing admin authentication/authorization guard.
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "orders", element: <AdminOrdersPage /> },
      {
        path: "orders/:orderId",
        element: <AdminOrderDetailsPage />,
      },
      {
        path: "payments",
        element: <PaymentVerificationPage />,
      },
      {
        path: "products",
        element: <AdminProductsPage />,
      },
      {
        path: "products/add",
        element: <AdminProductFormPage />,
      },
      {
        path: "products/edit/:productId",
        element: <AdminProductFormPage />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
