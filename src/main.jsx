import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import { createBrowserRouter, Navigate } from "react-router";

import { RouterProvider } from "react-router/dom";

// ========================================
// MAIN LAYOUT + PUBLIC PAGES
// ========================================

import Root from "./layouts/Root";

import Home from "./pages/home/Home";
import Shop from "./pages/shop/Shop";
import ProductDetails from "./pages/shop/ProductDetails";
import CartPage from "./pages/cart/CartPage";
import CheckoutPage from "./pages/cart/CheckoutPage";

import OrderConfirmationPage from "./pages/order/OrderConfirmationPage";
import OrderVerifiedPage from "./pages/order/OrderVerifiedPage";
import OrderRejectedPage from "./pages/order/OrderRejectedPage";
import OrderTrackingPage from "./pages/order/OrderTrackingPage";

import WishlistPage from "./pages/cart/WishlistPage";
import GiftCategoriesPage from "./pages/shop/GiftCategoriesPage";

// ========================================
// ERROR PAGES
// ========================================

import ErrorApp from "./pages/error/ErrorApp";
import ErrorPage from "./pages/error/ErrorPage";

// ========================================
// ADMIN PAGES
// ========================================

import AdminLayout from "./layouts/AdminLayout";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminOrderDetailsPage from "./pages/admin/AdminOrderDetailsPage";
import PaymentVerificationPage from "./pages/admin/PaymentVerificationPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminProductFormPage from "./pages/admin/AdminProductFormPage";

import AdminProtectedRoute from "./routes/AdminProtectedRoute";

// ========================================
// AUTHENTICATION PAGES
// ========================================

import AuthLayout from "./layouts/AuthLayout";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

// ========================================
// PROVIDERS
// ========================================

import AuthProvider from "./providers/AuthProvider";
import CartProvider from "./providers/CartProvider";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ========================================
// NOTIFICATIONS
// ========================================

import { ToastContainer } from "react-toastify";
import MyOrdersPage from "./pages/order/MyOrdersPage";
import ProfilePage from "./pages/profile/ProfilePage";
import ProfileProtectedRoute from "./routes/ProfileProtectedRoute";
import { WishlistProvider } from "./providers/WishlistProvider";
import AdminCustomersPage from "./pages/admin/AdminCustomersPage";
import AdminDeliveryManagementPage from "./pages/admin/AdminDeliveryManagementPage";
import HelpAndPoliciesPage from "./pages/information/HelpAndPoliciesPage";

// ========================================
// REACT QUERY CLIENT
// ========================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
    },
  },
});

// ========================================
// ROUTER CONFIGURATION
// ========================================

const router = createBrowserRouter([
  // ======================================
  // PUBLIC ROUTES
  // ======================================

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
        path: "shop/:id",
        element: <ProductDetails />,
      },
      {
        path: "cart",
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
        path: "my-orders",
        element: <MyOrdersPage />,
      },
      {
        path: "profile",
        element: (
          <ProfileProtectedRoute>
            <ProfilePage />
          </ProfileProtectedRoute>
        ),
      },

      {
        path: "help",
        element: <HelpAndPoliciesPage />,
      },
      {
        path: "faq",
        element: <Navigate to="/help#faq" replace />,
      },
      {
        path: "delivery",
        element: <Navigate to="/help#delivery" replace />,
      },
      {
        path: "return-policy",
        element: <Navigate to="/help#return-policy" replace />,
      },
      {
        path: "privacy-policy",
        element: <Navigate to="/help#privacy-policy" replace />,
      },
      {
        path: "terms",
        element: <Navigate to="/help#terms" replace />,
      },

      {
        path: "*",
        element: <ErrorPage />,
      },
    ],
  },

  // ======================================
  // AUTHENTICATION ROUTES
  // ======================================

  {
    path: "/",
    element: <AuthLayout />,

    children: [
      {
        path: "login",
        element: <Login />,
      },

      {
        path: "register",
        element: <Register />,
      },

      {
        path: "forgot-password",
        element: <ForgotPassword />,
      },
    ],
  },

  // ======================================
  // ADMIN ROUTES
  // ======================================

  {
    path: "/admin",
    errorElement: <ErrorApp />,

    element: (
      <AdminProtectedRoute>
        <AdminLayout />
      </AdminProtectedRoute>
    ),

    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },

      {
        path: "orders",
        element: <AdminOrdersPage />,
      },

      {
        path: "orders/:orderId",
        element: <AdminOrderDetailsPage />,
      },

      {
        path: "payments",
        element: <PaymentVerificationPage />,
      },
      {
        path: "customers",
        element: <AdminCustomersPage />,
      },

      {
        path: "products",
        element: <AdminProductsPage />,
      },
      {
        path: "deliveries",
        element: <AdminDeliveryManagementPage />,
      },

      {
        path: "products/add",
        element: <AdminProductFormPage />,
      },

      {
        path: "products/edit/:productId",
        element: <AdminProductFormPage />,
      },
      {
        path: "profile/:id",
        element: <ProfilePage />,
      },
      {
        path: "*",
        element: <ErrorPage />,
      },
    ],
  },
]);

// ========================================
// APPLICATION ROOT
// ========================================

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <RouterProvider router={router} />
            <ToastContainer position="top-right" autoClose={2500} />
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
