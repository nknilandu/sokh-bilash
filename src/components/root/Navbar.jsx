import { useContext, useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  Heart,
  ShoppingBag,
  LogIn,
  LogOut,
  Search,
  UserRound,
  LoaderCircle,
  House,
  Gift,
  LayoutGrid,
  PackagePlus,
  LayoutDashboard,
  CreditCard,
  ClipboardList,
  Package,
} from "lucide-react";

import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

import Swal from "sweetalert2";
import { AuthContext } from "../../providers/AuthProvider";
import logo from "../../assets/sokhbilash-nav-logo.png";

// ================= Customer Navigation =================

const customerNavLinks = [
  { name: "হোম", path: "/", icon: House },
  { name: "সব উপহার", path: "/shop", icon: Gift },
  { name: "ক্যাটাগরি", path: "/categories", icon: LayoutGrid },
  { name: "কাস্টম গিফট", path: "/gift-box", icon: PackagePlus },
];

const customerDesktopLinks = [
  ...customerNavLinks,
  { name: "কার্ট", path: "/cart", icon: ShoppingBag },
];

const customerMobileLinks = [
  ...customerNavLinks,
  { name: "উইশলিস্ট", path: "/wishlist", icon: Heart },
  { name: "আমার কার্ট", path: "/cart", icon: ShoppingBag },
];

// ================= Admin Navigation =================

const adminNavLinks = [
  { name: "হোম", path: "/", icon: House },
  { name: "ড্যাশবোর্ড", path: "/admin", icon: LayoutDashboard },
  { name: "প্রোডাক্ট", path: "/admin/products", icon: Package },
  { name: "পেমেন্ট", path: "/admin/payments", icon: CreditCard },
  { name: "অর্ডার", path: "/admin/orders", icon: ClipboardList },
];

// ================= User Avatar =================

const UserAvatar = ({ user, size = "size-10" }) => {
  const [failedUrl, setFailedUrl] = useState(null);

  const name = user?.displayName || user?.email?.split("@")[0] || "U";

  const showPhoto = user?.photoURL && failedUrl !== user.photoURL;

  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-secondary/15 bg-gold-soft text-primary`}
    >
      {showPhoto ? (
        <img
          src={user.photoURL}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setFailedUrl(user.photoURL)}
        />
      ) : (
        <span className="text-sm font-bold">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
};

// ================= Navbar =================

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, loading, role, roleLoading, accountStatus, logOut } =
    useContext(AuthContext);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const profileRef = useRef(null);

  // ================= Role Based Navigation =================

  const isAdmin = role === "admin" && accountStatus === "active";

  const navigationLoading = loading || (user && roleLoading);

  const desktopNavLinks = isAdmin ? adminNavLinks : customerDesktopLinks;

  const mobileNavLinks = isAdmin ? adminNavLinks : customerMobileLinks;

  const displayName =
    user?.displayName || user?.email?.split("@")[0] || "ব্যবহারকারী";

  const closeAll = () => {
    setIsDrawerOpen(false);
    setIsProfileOpen(false);
  };

  // Close menus when route changes
  useEffect(() => {
    setIsDrawerOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname, location.search]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeAll();
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Disable background scroll when drawer opens
  useEffect(() => {
    if (!isDrawerOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [isDrawerOpen]);

  // ================= Search =================

  const handleSearchClick = () => {
    closeAll();

    navigate("/shop", {
      state: { focusSearch: true },
    });
  };

  // ================= Logout =================

  const handleLogout = async () => {
    if (loggingOut) return;

    const result = await Swal.fire({
      title: "লগআউট করতে চান?",
      text: "আপনি কি নিশ্চিত?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, লগআউট",
      cancelButtonText: "বাতিল",
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#76258A",
    });

    if (!result.isConfirmed) return;

    setLoggingOut(true);

    try {
      await logOut();

      closeAll();
      navigate("/login", { replace: true });

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
      console.error("Logout Error:", error);

      Swal.fire({
        title: "লগআউট করা যায়নি!",
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } finally {
      setLoggingOut(false);
    }
  };

  // ================= UI =================

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-primary text-primary-content shadow-lg">
      <div className="page-container">
        <div className="flex min-h-[76px] items-center justify-between gap-3">
          {/* Logo */}
          <Link
            to="/"
            onClick={closeAll}
            aria-label="SokhBilash Home"
            className="flex shrink-0 items-center"
          >
            <img
              src={logo}
              alt="SokhBilash"
              className="h-15 w-auto max-w-36 object-contain brightness-0 invert"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-4 lg:flex xl:gap-7">
            {!navigationLoading &&
              desktopNavLinks.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `whitespace-nowrap text-sm font-medium transition-colors ${
                      isActive
                        ? "text-gold-soft"
                        : "text-white/80 hover:text-gold-soft"
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
          </nav>

          {/* Right Actions */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {/* Search - Always Visible */}
            <button
              type="button"
              onClick={handleSearchClick}
              aria-label="Search products"
              title="উপহার খুঁজুন"
              className="flex size-10 items-center justify-center rounded-full text-white transition hover:bg-white/10 hover:text-gold-soft"
            >
              <Search size={21} />
            </button>

            {/* Wishlist - Customer Desktop Only */}
            {!isAdmin && !navigationLoading && (
              <Link
                to="/wishlist"
                onClick={closeAll}
                aria-label="Wishlist"
                title="আমার উইশলিস্ট"
                className="hidden size-10 items-center justify-center rounded-full text-white transition hover:bg-white/10 hover:text-gold-soft lg:flex"
              >
                <Heart size={21} />
              </Link>
            )}

            {/* Desktop Profile */}
            <div ref={profileRef} className="relative hidden lg:block">
              {loading ? (
                <div className="size-10 animate-pulse rounded-full bg-white/15" />
              ) : user ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen((prev) => !prev)}
                    aria-label="User profile"
                    aria-expanded={isProfileOpen}
                    className="rounded-full border-2 border-gold-soft/40 p-0.5 transition hover:border-gold-soft"
                  >
                    <UserAvatar user={user} size="size-9" />
                  </button>

                  {/* Profile Popup */}
                  {isProfileOpen && (
                    <div className="absolute right-0 top-full z-50 mt-3 w-72 rounded-2xl border border-base-300 bg-white p-4 text-primary shadow-xl">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} size="size-13" />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-primary">
                            {displayName}
                          </p>

                          <p className="mt-1 truncate text-xs text-muted">
                            {user.email}
                          </p>

                          {isAdmin && (
                            <span className="mt-1 inline-block rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {/* Profile */}
                        <Link
                          to="/profile"
                          onClick={closeAll}
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-secondary/20 bg-secondary/5 px-3 py-2.5 text-xs font-semibold text-secondary transition hover:bg-secondary/10"
                        >
                          <UserRound size={15} />
                          প্রোফাইল
                        </Link>

                        {/* Logout */}
                        <button
                          type="button"
                          onClick={handleLogout}
                          disabled={loggingOut}
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-60"
                        >
                          {loggingOut ? (
                            <LoaderCircle size={15} className="animate-spin" />
                          ) : (
                            <LogOut size={15} />
                          )}
                          লগআউট
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-gold-soft px-4 py-2 text-sm font-semibold text-primary transition hover:brightness-95"
                >
                  <LogIn size={17} />
                  লগইন
                </Link>
              )}
            </div>

            {/* Mobile Menu */}
            <button
              type="button"
              onClick={() => {
                setIsDrawerOpen(true);
                setIsProfileOpen(false);
              }}
              aria-label="Open menu"
              aria-expanded={isDrawerOpen}
              aria-controls="mobile-drawer"
              className="flex size-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10 lg:hidden"
            >
              <Menu size={25} />
            </button>
          </div>
        </div>
      </div>

      {/* ================= Mobile Drawer ================= */}

      {isDrawerOpen && (
        <div id="mobile-drawer" className="fixed inset-0 z-[100] lg:hidden">
          {/* Backdrop */}
          <button
            type="button"
            onClick={closeAll}
            aria-label="Close menu"
            className="absolute inset-0 h-full w-full bg-black/60"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className="absolute inset-y-0 right-0 flex h-full w-[85%] max-w-sm flex-col bg-white text-primary shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-base-300 px-5 py-4">
              <img
                src={logo}
                alt="SokhBilash"
                className="h-9 w-auto object-contain"
              />

              <button
                type="button"
                onClick={closeAll}
                aria-label="Close navigation"
                className="flex size-9 items-center justify-center rounded-lg bg-base-200 text-primary"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5">
              {/* Profile Card */}
              {loading ? (
                <div className="h-28 animate-pulse rounded-xl bg-base-200" />
              ) : user ? (
                <div className="rounded-xl border border-secondary/10 bg-secondary/5 p-3.5">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={user} size="size-13" />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-primary">
                        {displayName}
                      </p>

                      <p className="mt-1 truncate text-xs text-muted">
                        {user.email}
                      </p>

                      {isAdmin && (
                        <span className="mt-1 text-[10px] font-semibold text-secondary">
                          Admin Account
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Profile + Logout */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      to="/profile"
                      onClick={closeAll}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-secondary/20 bg-white px-3 py-2.5 text-xs font-semibold text-secondary"
                    >
                      <UserRound size={15} />
                      প্রোফাইল
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-60"
                    >
                      {loggingOut ? (
                        <LoaderCircle size={15} className="animate-spin" />
                      ) : (
                        <LogOut size={15} />
                      )}
                      লগআউট
                    </button>
                  </div>
                </div>
              ) : (
                /* Guest */
                <div className="rounded-xl border border-secondary/10 bg-secondary/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-full bg-white text-secondary">
                      <UserRound size={22} />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-primary">স্বাগতম!</p>
                      <p className="mt-1 text-xs text-muted">
                        আপনার অ্যাকাউন্টে লগইন করুন
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/login"
                    onClick={closeAll}
                    className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 text-xs font-semibold text-white"
                  >
                    <LogIn size={16} />
                    লগইন করুন
                  </Link>
                </div>
              )}

              {/* Role Based Drawer Links */}
              <nav className="mt-5 space-y-1">
                {navigationLoading ? (
                  <div className="space-y-3 py-4">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="h-10 animate-pulse rounded-lg bg-base-200"
                      />
                    ))}
                  </div>
                ) : (
                  mobileNavLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === "/"}
                        onClick={closeAll}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                            isActive
                              ? "bg-secondary/10 text-secondary"
                              : "text-primary/80 hover:bg-base-200 hover:text-secondary"
                          }`
                        }
                      >
                        <Icon size={19} />
                        {item.name}
                      </NavLink>
                    );
                  })
                )}
              </nav>
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-base-300 px-5 py-4 text-center">
              <p className="text-[11px] text-muted">
                © {new Date().getFullYear()} SokhBilash
              </p>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
};

export default Navbar;
