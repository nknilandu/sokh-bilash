
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
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
  Bell,
  LogOut,
  Gift,
} from "lucide-react";

const menus = [
  { label: "ড্যাশবোর্ড", path: "/admin", icon: LayoutDashboard, end: true },
  { label: "অর্ডার ম্যানেজমেন্ট", path: "/admin/orders", icon: ShoppingBag },
  { label: "পেমেন্ট ভেরিফিকেশন", path: "/admin/payments", icon: BadgeCheck },
  { label: "প্রোডাক্ট ম্যানেজমেন্ট", path: "/admin/products", icon: Package },
  { label: "ডেলিভারি ম্যানেজমেন্ট", path: "/admin/delivery", icon: Truck },
  { label: "কাস্টমার ম্যানেজমেন্ট", path: "/admin/customers", icon: Users },
  { label: "রিপোর্ট ও অ্যানালিটিক্স", path: "/admin/analytics", icon: ChartNoAxesCombined },
  { label: "সেটিংস", path: "/admin/settings", icon: Settings },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-base-200/60">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-primary/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-base-300 bg-base-100 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-18 items-center justify-between border-b border-base-300 px-5 py-4">
          <NavLink to="/admin" className="flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-gold-soft">
              <Gift size={22} />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-primary">শখবিলাস</h2>
              <p className="text-[10px] text-muted">Admin Panel</p>
            </div>
          </NavLink>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Management
          </p>

          {menus.map(({ label, path, icon: Icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:bg-secondary/10 hover:text-primary"
                }`
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-base-300 p-4">
          <div className="mb-3 rounded-xl bg-base-200 p-3">
            <p className="font-bold text-primary">SokhBilash Admin</p>
            <p className="text-xs text-muted">Administrator</p>
          </div>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-muted hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={18} />
            লগআউট
          </button>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-base-300 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-primary hover:bg-base-200 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-sm font-bold text-primary sm:text-base">
                Admin Dashboard
              </h1>
              <p className="text-[11px] text-muted">
                SokhBilash Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Notifications"
              className="relative rounded-xl bg-base-200 p-2.5 text-primary"
            >
              <Bell size={19} />
            </button>
            <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-white">
              A
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 max-w-8xl mx-auto h-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
