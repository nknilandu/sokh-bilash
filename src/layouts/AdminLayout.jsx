import { useContext, useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  ShoppingBag,
  BadgeCheck,
  Package,
  Truck,
  Users,
  ChartNoAxesCombined,
  Settings,
  Menu,
  X,
  LogOut,
  ArrowUpRight,
  ChevronRight,
  LoaderCircle,
  Store,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import Swal from "sweetalert2";

import ScrollToTop from "../components/system/ScrollToTop";
import { AuthContext } from "../providers/AuthProvider";
import logo from "../assets/sokhbilash-nav-logo.png";

// ========================================
// ADMIN SIDEBAR MENUS
// ========================================

const menus = [
  {
    label: "ড্যাশবোর্ড",
    path: "/admin",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "অর্ডার ম্যানেজমেন্ট",
    path: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    label: "পেমেন্ট ভেরিফিকেশন",
    path: "/admin/payments",
    icon: BadgeCheck,
  },
  {
    label: "প্রোডাক্ট ম্যানেজমেন্ট",
    path: "/admin/products",
    icon: Package,
  },
  {
    label: "ডেলিভারি ম্যানেজমেন্ট",
    path: "/admin/deliveries",
    icon: Truck,
  },
  {
    label: "কাস্টমার ম্যানেজমেন্ট",
    path: "/admin/customers",
    icon: Users,
  },

];

// ========================================
// ADMIN AVATAR
// ========================================

function AdminAvatar({ user, size = "size-10" }) {
  const [failedUrl, setFailedUrl] = useState(null);

  const name = user?.displayName || user?.email?.split("@")[0] || "Admin";

  const photoURL = user?.photoURL || "";

  const showPhoto = Boolean(photoURL) && failedUrl !== photoURL;

  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-secondary/15 bg-accent/40 text-secondary`}
    >
      {showPhoto ? (
        <img
          src={photoURL}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setFailedUrl(photoURL)}
        />
      ) : (
        <span className="text-sm font-bold">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

// ========================================
// ADMIN LAYOUT
// ========================================

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logOut } = useContext(AuthContext);

  // ========================================
  // STATES
  // ========================================

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  // ========================================
  // ADMIN INFORMATION
  // ========================================

  const displayName =
    user?.displayName || user?.email?.split("@")[0] || "Administrator";

  const email = user?.email || "";

  // ========================================
  // CURRENT PAGE INFORMATION
  // ========================================

  const currentMenu =
    menus.find((item) => {
      if (item.end) {
        return location.pathname === item.path;
      }

      return (
        location.pathname === item.path ||
        location.pathname.startsWith(`${item.path}/`)
      );
    }) || menus[0];

  const CurrentIcon = currentMenu.icon;

  // ========================================
  // CLOSE SIDEBAR ON ROUTE CHANGE
  // ========================================

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // ========================================
  // LOCK BODY SCROLL ON MOBILE
  // ========================================

  useEffect(() => {
    if (!sidebarOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  // ========================================
  // LOGOUT
  // ========================================

  const handleLogout = async () => {
    if (loggingOut) return;

    const result = await Swal.fire({
      title: "লগআউট করতে চান?",
      text: "আপনি কি Admin Panel থেকে লগআউট করতে চান?",
      icon: "question",

      showCancelButton: true,

      confirmButtonText: "হ্যাঁ, লগআউট",
      cancelButtonText: "বাতিল",

      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#76258A",

      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setLoggingOut(true);

    try {
      await logOut();

      setSidebarOpen(false);

      navigate("/login", {
        replace: true,
      });

      Swal.fire({
        title: "সফলভাবে লগআউট হয়েছে!",
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error("Admin Logout Error:", error);

      Swal.fire({
        title: "লগআউট করা যায়নি",
        text: error?.message || "আবার চেষ্টা করুন।",
        icon: "error",
        confirmButtonColor: "#76258A",
      });
    } finally {
      setLoggingOut(false);
    }
  };

  // ========================================
  // COMPONENT UI
  // ========================================

  return (
    <>
      <div className="min-h-screen bg-base-200/50">
        {/* ================================= */}
        {/* MOBILE SIDEBAR OVERLAY */}
        {/* ================================= */}

        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-primary/50 backdrop-blur-[2px] lg:hidden"
          />
        )}

        {/* ================================= */}
        {/* SIDEBAR */}
        {/* ================================= */}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-base-300 bg-base-100 shadow-xl transition-transform duration-300 lg:translate-x-0 lg:shadow-none ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* ================================= */}
          {/* BRAND LOGO */}
          {/* ================================= */}

          <div className="flex h-20 shrink-0 items-center justify-between border-b border-base-300/70 px-5">
            <Link
              to="/admin"
              onClick={() => setSidebarOpen(false)}
              className="flex min-w-0 items-center gap-3"
              aria-label="SokhBilash Admin Dashboard"
            >
              <img
                src={logo}
                alt="SokhBilash"
                className="h-14 w-auto max-w-40 object-contain"
              />
            </Link>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
              className="flex size-9 items-center justify-center rounded-lg text-muted transition hover:bg-base-200 hover:text-primary lg:hidden"
            >
              <X size={19} />
            </button>
          </div>

          {/* ================================= */}
          {/* ADMIN PANEL LABEL */}
          {/* ================================= */}

          <div className="px-4 pt-5">
            <div className="flex items-center gap-3 rounded-xl border border-secondary/10 bg-secondary/5 px-3 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-gold-soft">
                <ShieldCheck size={19} />
              </span>

              <div className="min-w-0">
                <p className="text-xs font-bold text-primary">
                  Admin Workspace
                </p>

                <p className="mt-0.5 text-[10px] text-muted">
                  স্টোর ম্যানেজমেন্ট প্যানেল
                </p>
              </div>
            </div>
          </div>

          {/* ================================= */}
          {/* SIDEBAR NAVIGATION */}
          {/* ================================= */}

          <nav
            aria-label="Admin navigation"
            className="mt-5 flex-1 space-y-1 overflow-y-auto px-3 pb-5"
          >
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
              MANAGEMENT
            </p>

            {menus.map(({ label, path, icon: Icon, end }) => (
              <NavLink
                key={path}
                to={path}
                end={end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center justify-between gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-white shadow-[0_4px_12px_rgba(49,0,57,0.15)]"
                      : "text-muted hover:bg-secondary/10 hover:text-primary"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex min-w-0 items-center gap-3">
                      <Icon
                        size={19}
                        className={`shrink-0 ${
                          isActive
                            ? "text-gold-soft"
                            : "text-secondary/70 group-hover:text-secondary"
                        }`}
                      />

                      <span className="truncate">{label}</span>
                    </div>

                    {isActive && (
                      <ChevronRight
                        size={15}
                        className="shrink-0 text-gold-soft"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* ================================= */}
          {/* SIDEBAR FOOTER */}
          {/* LOGOUT ONLY — NO PROFILE */}
          {/* ================================= */}

          <div className="shrink-0 border-t border-base-300/70 bg-base-100 p-4">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex items-center gap-3">
                {loggingOut ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <LogOut size={18} />
                )}

                {loggingOut ? "লগআউট হচ্ছে..." : "লগআউট"}
              </span>

              <ArrowUpRight size={16} />
            </button>

            <p className="mt-4 text-center text-[10px] text-muted">
              © {new Date().getFullYear()} SokhBilash
            </p>
          </div>
        </aside>

        {/* ================================= */}
        {/* MAIN CONTENT AREA */}
        {/* ================================= */}

        <div className="min-w-0 lg:pl-64">
          {/* ================================= */}
          {/* ADMIN TOP HEADER */}
          {/* ================================= */}

          <header className=" sticky top-0 z-30 border-b border-base-300/80 bg-white/95 shadow-[0_2px_12px_rgba(49,0,57,0.03)] backdrop-blur-xl">
            <div className="flex min-h-20 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              {/* =========================== */}
              {/* HEADER LEFT */}
              {/* =========================== */}

              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                {/* MOBILE MENU */}

                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open sidebar"
                  aria-expanded={sidebarOpen}
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-base-300 bg-base-100 text-primary transition hover:border-secondary/30 hover:bg-secondary/5 lg:hidden"
                >
                  <Menu size={21} />
                </button>

                {/* CURRENT PAGE ICON */}

                <div className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary sm:flex">
                  <CurrentIcon size={21} />
                </div>

                {/* PAGE TITLE + BREADCRUMB */}

                <div className="min-w-0">
                  <div className="mb-1 hidden items-center gap-1.5 text-[11px] text-muted sm:flex">
                    <Link
                      to="/admin"
                      className="transition hover:text-secondary"
                    >
                      Admin
                    </Link>

                    <ChevronRight size={12} />

                    <span className="truncate text-secondary">
                      {currentMenu.label}
                    </span>
                  </div>

                  <h1 className="truncate text-base font-bold leading-tight text-primary sm:text-lg">
                    {currentMenu.label}
                  </h1>

                  <p className="mt-1 text-[10px] text-muted sm:hidden">
                    SokhBilash Management
                  </p>
                </div>
              </div>

              {/* =========================== */}
              {/* HEADER RIGHT */}
              {/* =========================== */}

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                {/* STORE FRONT LINK */}

                <Link
                  to="/"
                  title="ওয়েবসাইট দেখুন"
                  className="hidden items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-3 py-2.5 text-xs font-semibold text-primary transition hover:border-secondary/30 hover:bg-secondary/5 hover:text-secondary md:inline-flex"
                >
                  <Store size={16} />
                  ওয়েবসাইট দেখুন
                  <ArrowUpRight size={14} />
                </Link>

                {/* DIVIDER */}

                <div className="hidden h-8 w-px bg-base-300 sm:block" />

                {/* ================================= */}
                {/* ADMIN PROFILE — HEADER ONLY       */}
                {/* ================================= */}

                <Link
                  to="/profile"
                  title="Admin Profile"
                  className="group flex min-w-0 items-center gap-3 rounded-xl border border-transparent p-2 transition hover:border-secondary/15 hover:bg-secondary/5"
                >
                  {/* PROFILE IMAGE */}

                  <AdminAvatar user={user} size="size-11" />

                  {/* ADMIN INFORMATION */}

                  <div className="hidden min-w-0 flex-col sm:flex">
                    {/* NAME */}

                    <p className="max-w-48 truncate text-sm font-bold text-primary transition group-hover:text-secondary">
                      {displayName}
                    </p>

                    {/* EMAIL */}

                    <p
                      title={email}
                      className=" max-w-48 truncate text-[11px] text-muted"
                    >
                      {email}
                    </p>

                    {/* ROLE */}

                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-secondary">
                      <ShieldCheck size={11} />
                      Administrator
                    </span>
                  </div>

                  <ChevronRight
                    size={15}
                    className="hidden shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-secondary sm:block"
                  />
                </Link>
              </div>
            </div>
          </header>

          {/* ================================= */}
          {/* DASHBOARD PAGE CONTENT */}
          {/* ================================= */}

          <main className="mx-auto min-h-[calc(100vh-5rem)] w-full max-w-8xl p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>

      <ScrollToTop />
    </>
  );
}
