import { useState } from "react";
import {
  Menu,
  X,
  Heart,
  ShoppingBag,
  LogIn,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import logo from "../../assets/sokhbilash-footer-logo.png"

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Replace these with your actual auth and cart data
  const user = null;
  const wishlistCount = 0;
  const cartCount = 0;

  const navLinks = [
    { name: "হোম", path: "/" },
    { name: "সব উপহার", path: "/shop" },
    { name: "ক্যাটাগরি", path: "/categories" },
    { name: "কাস্টম গিফট", path: "/gift-box" },
    { name: "আমাদের সম্পর্কে", path: "/about" },
  ];

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-primary text-primary-content shadow-lg">
      <div className="page-container">
        <div className="flex min-h-[76px] items-center justify-between gap-4">
          {/* Brand */}
          <Link
            to="/"
            onClick={closeMenu}
            className="flex shrink-0 items-center gap-2"
            aria-label="SokhBilash Home"
          >
            <img src={logo} alt="sokhbilash logo" className="h-15 brightness-0 invert"/>

          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-5 lg:flex xl:gap-7">
            {navLinks.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
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

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative rounded-full p-2 transition hover:bg-white/10"
              aria-label="Wishlist"
            >
              <Heart size={22} />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-soft px-1 text-[10px] font-bold text-primary">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative flex items-center gap-2 rounded-full border border-gold-soft/30 px-3 py-2 transition hover:bg-white/10 sm:px-4"
              aria-label="Shopping cart"
            >
              <ShoppingBag size={21} className="text-gold-soft" />

              <span className="hidden text-sm font-semibold sm:inline">
                কার্ট
              </span>

              {cartCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-soft px-1 text-xs font-bold text-primary">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User profile: display only, no dropdown */}
            {user ? (
              <div className="hidden max-w-44 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 md:flex">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-soft font-bold text-primary">
                  {user.displayName?.charAt(0) || "U"}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {user.displayName || "ব্যবহারকারী"}
                  </p>
                  <p className="truncate text-xs text-gold-soft">
                    {user.email || ""}
                  </p>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden items-center gap-2 rounded-full bg-gold-soft px-4 py-2.5 font-semibold text-primary transition hover:brightness-95 sm:inline-flex"
              >
                <LogIn size={17} />
                লগইন
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="rounded-xl p-2 transition hover:bg-white/10 lg:hidden"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <nav className="border-t border-white/10 py-4 lg:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-white/10 text-gold-soft"
                        : "text-white/85 hover:bg-white/5 hover:text-gold-soft"
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}

              {!user && (
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gold-soft px-4 py-3 font-semibold text-primary sm:hidden"
                >
                  <LogIn size={18} />
                  লগইন
                </Link>
              )}

              {user && (
                <div className="mt-2 rounded-xl bg-white/5 px-4 py-3 md:hidden">
                  <p className="font-semibold">
                    {user.displayName || "ব্যবহারকারী"}
                  </p>
                  <p className="mt-1 break-all text-xs text-white/60">
                    {user.email || ""}
                  </p>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;