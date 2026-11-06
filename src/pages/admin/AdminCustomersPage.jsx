import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  ShoppingBag,
  Search,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  UserRound,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

import { AuthContext } from "../../providers/AuthProvider";
import { API_URL } from "../../utils/siteConfig";


const PER_PAGE = 10;

const money = (value) =>
  `৳${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const bn = (value) => Number(value || 0).toLocaleString("bn-BD");

const dateText = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("bn-BD", {
    timeZone: "Asia/Dhaka",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ========================================
// CUSTOMER API
// ========================================

async function getCustomers(user, params, signal) {
  const token = await user.getIdToken();

  const response = await fetch(`${API_URL}/admin/customers?${params}`, {
    signal,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success !== true) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }

  return result;
}

// ========================================
// STAT CARD
// ========================================

function StatCard({ title, subtitle, value, icon: Icon, iconClass }) {
  return (
    <div className="rounded-xl border border-base-300/70 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold text-primary sm:text-sm">{title}</h3>

          <p className="mt-1 text-[11px] text-muted">{subtitle}</p>
        </div>

        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={20} />
        </div>
      </div>

      <p className="mt-4 text-2xl font-bold text-primary sm:text-3xl">
        {bn(value)}
      </p>
    </div>
  );
}

// ========================================
// CUSTOMER AVATAR
// ========================================

function Avatar({ customer, size = "size-10" }) {
  const [broken, setBroken] = useState("");

  const url = customer.photoUrl || "";

  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full border border-secondary/15 bg-secondary/10 text-secondary`}
    >
      {url && broken !== url ? (
        <img
          src={url}
          alt={customer.name || "Customer"}
          loading="lazy"
          onError={() => setBroken(url)}
          className="h-full w-full object-cover"
        />
      ) : (
        <UserRound size={20} />
      )}
    </div>
  );
}

// ========================================
// STATUS BADGE
// ========================================

function AccountBadge({ status }) {
  const active = status === "active";

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${
        active
          ? "border-green-100 bg-green-50 text-green-700"
          : "border-red-100 bg-red-50 text-red-700"
      }`}
    >
      {active ? "Active" : status || "Restricted"}
    </span>
  );
}

// ========================================
// CUSTOMER ADDITIONAL INFORMATION
// ========================================

function CustomerExtra({ customer }) {
  return (
    <div className="grid gap-3 rounded-xl border border-secondary/15 bg-secondary/5 p-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
      {/* ADDRESS */}

      <div>
        <p className="text-[11px] text-muted">পূর্ণ ঠিকানা</p>

        <p className="mt-1 break-words font-semibold text-primary">
          {customer.address || "সেভ করা নেই"}
        </p>

        <p className="mt-1 text-muted">
          {[customer.district, customer.division].filter(Boolean).join(", ") ||
            "—"}
        </p>
      </div>

      {/* REGISTRATION */}

      <div>
        <p className="text-[11px] text-muted">রেজিস্ট্রেশন</p>

        <p className="mt-1 font-semibold text-primary">
          {dateText(customer.createdAt)}
        </p>

        <p className="mt-1 text-muted">
          UID: <span className="break-all">{customer.uid}</span>
        </p>
      </div>

      {/* ORDER SUMMARY */}

      <div>
        <p className="text-[11px] text-muted">অর্ডার সারাংশ</p>

        <p className="mt-1 font-semibold text-primary">
          মোট {bn(customer.orderCount)}টি / Delivered{" "}
          {bn(customer.deliveredOrders)}টি
        </p>

        <p className="mt-1 text-muted">
          Delivered order value: {money(customer.totalSpent)}
        </p>
      </div>

      {/* LAST ORDER */}

      <div>
        <p className="text-[11px] text-muted">সর্বশেষ অর্ডার</p>

        <p className="mt-1 font-semibold text-primary">
          {dateText(customer.lastOrderAt)}
        </p>

        {customer.lastOrderId ? (
          <Link
            to={`/admin/orders/${encodeURIComponent(customer.lastOrderId)}`}
            className="mt-2 inline-flex items-center gap-1 font-bold text-secondary hover:underline"
          >
            #{customer.lastOrderNumber || "Order"}
            <Eye size={13} />
          </Link>
        ) : (
          <p className="mt-2 text-muted">এখনো অর্ডার করেননি</p>
        )}
      </div>
    </div>
  );
}

// ========================================
// TABLE FRAGMENT
// ========================================

function FragmentRow({ children }) {
  return <>{children}</>;
}

// ========================================
// MAIN PAGE
// ========================================

export default function AdminCustomersPage() {
  const auth = useContext(AuthContext) || {};

  const { user, loading } = auth;

  const currentRole = auth.role ?? auth.roleState?.role;

  const currentStatus = auth.accountStatus ?? auth.roleState?.status;

  const checking = Boolean(
    loading || (user && (auth.roleLoading || auth.roleState?.checking)),
  );

  const allowed =
    !checking &&
    Boolean(user) &&
    currentRole === "admin" &&
    currentStatus === "active";

  // ========================================
  // FILTER STATES
  // ========================================

  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("all");

  const [ordersFilter, setOrdersFilter] = useState("all");

  const [sort, setSort] = useState("newest");

  const [expandedUid, setExpandedUid] = useState(null);

  // ========================================
  // QUERY PARAMETERS
  // ========================================

  const params = new URLSearchParams({
    page: String(page),
    search: search.trim(),
    status,
    orders: ordersFilter,
    sort,
  });

  // ========================================
  // REACT QUERY
  // ========================================

  const customerQuery = useQuery({
    queryKey: [
      "admin-customers",
      user?.uid,
      page,
      search.trim(),
      status,
      ordersFilter,
      sort,
    ],

    enabled: allowed,

    queryFn: ({ signal }) => getCustomers(user, params.toString(), signal),

    staleTime: 15000,
    refetchOnWindowFocus: true,
  });

  // ========================================
  // API DATA
  // ========================================

  const data = customerQuery.data || {};

  const customers = Array.isArray(data.customers) ? data.customers : [];

  const stats = data.stats || {};

  const pagination = data.pagination || {};

  const total = Number(pagination.total || 0);

  const totalPages = Math.max(1, Number(pagination.totalPages || 1));

  // ========================================
  // FILTER CHANGES
  // ========================================

  const changeFilter = (setter, value) => {
    setter(value);
    setPage(1);
    setExpandedUid(null);
  };

  // ========================================
  // AUTH LOADING
  // ========================================

  if (checking) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-secondary">
        <Loader2 size={28} className="animate-spin" />

        <p className="text-sm">Admin Account যাচাই হচ্ছে...</p>
      </div>
    );
  }

  // ========================================
  // ACCESS DENIED
  // ========================================

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-base-300 bg-white p-12 text-center">
        <ShieldCheck size={35} className="mx-auto text-secondary" />

        <h2 className="mt-3 text-lg font-bold text-primary">Access Denied</h2>

        <p className="mt-2 text-xs text-muted">
          শুধুমাত্র Active Admin Customer Management দেখতে পারবেন।
        </p>
      </div>
    );
  }

  // ========================================
  // PAGE
  // ========================================

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-10">
      {/* ================================== */}
      {/* HEADER */}
      {/* ================================== */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary sm:text-2xl">
            কাস্টমার ম্যানেজমেন্ট
          </h1>

          <p className="mt-1 text-xs text-muted">
            Registered Customers, Order Activity & Account Overview
          </p>
        </div>

        <button
          type="button"
          disabled={customerQuery.isFetching}
          onClick={() => customerQuery.refetch()}
          className="inline-flex items-center gap-2 rounded-xl border border-base-300 bg-white px-4 py-2.5 text-xs font-bold text-secondary hover:bg-secondary/5 disabled:opacity-50"
        >
          <RefreshCcw
            size={15}
            className={customerQuery.isFetching ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* ================================== */}
      {/* FIVE STAT CARDS */}
      {/* ================================== */}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="মোট কাস্টমার"
          subtitle="Registered accounts"
          value={stats.total}
          icon={Users}
          iconClass="bg-secondary/10 text-secondary"
        />

        <StatCard
          title="Active Customers"
          subtitle="Currently active"
          value={stats.active}
          icon={UserCheck}
          iconClass="bg-green-100 text-green-700"
        />

        <StatCard
          title="Restricted Customers"
          subtitle="Inactive / disabled"
          value={stats.restricted}
          icon={UserX}
          iconClass="bg-red-100 text-red-700"
        />

        <StatCard
          title="নতুন কাস্টমার"
          subtitle="This month (Dhaka)"
          value={stats.newThisMonth}
          icon={UserPlus}
          iconClass="bg-fuchsia-100 text-secondary"
        />

        <StatCard
          title="Guest Orders"
          subtitle="Not registered accounts"
          value={stats.guestOrders}
          icon={ShoppingBag}
          iconClass="bg-amber-100 text-amber-800"
        />
      </section>

      {/* ================================== */}
      {/* CUSTOMERS TABLE */}
      {/* ================================== */}

      <section className="overflow-hidden rounded-2xl border border-base-300/70 bg-white shadow-sm">
        {/* TABLE HEADER */}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 p-4 sm:p-5">
          <div>
            <h2 className="text-base font-bold text-primary">সকল কাস্টমার</h2>

            <p className="mt-1 text-xs text-muted">
              Customer List & Order Summary
            </p>
          </div>

          <span className="rounded-full bg-secondary/10 px-3 py-1.5 text-xs font-bold text-secondary">
            {bn(total)} Results
          </span>
        </div>

        {/* ================================== */}
        {/* SEARCH + FILTERS */}
        {/* ================================== */}

        <div className="grid gap-3 border-b border-base-300 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[minmax(0,1fr)_165px_165px_160px]">
          {/* SEARCH */}

          <label className="flex h-11 items-center gap-2 rounded-xl border border-base-300 bg-base-200 px-3 focus-within:border-secondary">
            <Search size={16} className="shrink-0 text-muted" />

            <input
              type="search"
              value={search}
              maxLength={80}
              onChange={(event) => changeFilter(setSearch, event.target.value)}
              placeholder="Name, Email, Phone..."
              className="w-full min-w-0 bg-transparent text-xs text-primary outline-none"
            />
          </label>

          {/* STATUS */}

          <select
            value={status}
            onChange={(event) => changeFilter(setStatus, event.target.value)}
            className="h-11 w-full rounded-xl border border-base-300 bg-base-200 px-3 text-xs font-semibold text-primary outline-none"
          >
            <option value="all">সব Account</option>

            <option value="active">Active</option>

            <option value="restricted">Restricted</option>
          </select>

          {/* ORDER FILTER */}

          <select
            value={ordersFilter}
            onChange={(event) =>
              changeFilter(setOrdersFilter, event.target.value)
            }
            className="h-11 w-full rounded-xl border border-base-300 bg-base-200 px-3 text-xs font-semibold text-primary outline-none"
          >
            <option value="all">সব Customer</option>

            <option value="with_orders">Ordered</option>

            <option value="no_orders">No Orders</option>
          </select>

          {/* SORT */}

          <select
            value={sort}
            onChange={(event) => changeFilter(setSort, event.target.value)}
            className="h-11 w-full rounded-xl border border-base-300 bg-base-200 px-3 text-xs font-semibold text-primary outline-none"
          >
            <option value="newest">Newest</option>

            <option value="oldest">Oldest</option>

            <option value="orders">Most Orders</option>

            <option value="spent">Highest Spent</option>

            <option value="last_order">Recently Ordered</option>
          </select>
        </div>

        {/* ================================== */}
        {/* ERROR */}
        {/* ================================== */}

        {customerQuery.isError && (
          <div
            role="alert"
            className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700"
          >
            <AlertCircle size={16} className="mr-2 inline" />

            {customerQuery.error?.message || "Customers load failed"}

            <button
              type="button"
              className="ml-3 font-bold underline"
              onClick={() => customerQuery.refetch()}
            >
              Retry
            </button>
          </div>
        )}

        {/* ================================== */}
        {/* CUSTOMER LIST */}
        {/* ================================== */}

        {customerQuery.isPending ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-2 text-secondary">
            <Loader2 size={27} className="animate-spin" />

            <p className="text-xs text-muted">Customers লোড হচ্ছে...</p>
          </div>
        ) : !customerQuery.isError ? (
          <>
            {/* ============================= */}
            {/* DESKTOP TABLE */}
            {/* ============================= */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1150px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-base-300 bg-secondary/5 text-xs font-bold text-primary/60">
                    <th className="px-5 py-3">Customer</th>

                    <th className="px-5 py-3">Contact</th>

                    <th className="px-5 py-3">Location</th>

                    <th className="px-5 py-3">Orders</th>

                    <th className="px-5 py-3">Delivered Sales</th>

                    <th className="px-5 py-3">Last Order</th>

                    <th className="px-5 py-3">Status</th>

                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-base-300/60">
                  {customers.map((customer, index) => {
                    const expanded = expandedUid === customer.uid;

                    return (
                      <FragmentRow key={customer.uid}>
                        {/* CUSTOMER ROW */}

                        <tr
                          className={`hover:bg-secondary/5 ${
                            index % 2 === 0 ? "bg-white" : "bg-[#faf7fb]"
                          }`}
                        >
                          {/* CUSTOMER */}

                          <td className="px-5 py-3">
                            <div className="flex min-w-[160px] items-center gap-2.5">
                              <Avatar customer={customer} />

                              <div className="min-w-0">
                                <p
                                  title={customer.name}
                                  className="max-w-[170px] truncate text-xs font-bold text-primary"
                                >
                                  {customer.name || "Unnamed"}
                                </p>

                                <p className="mt-1 text-[11px] text-muted">
                                  Joined {dateText(customer.createdAt)}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* CONTACT */}

                          <td className="px-5 py-3">
                            <p
                              title={customer.email}
                              className="max-w-[180px] truncate text-xs text-primary"
                            >
                              {customer.email || "—"}
                            </p>

                            <p className="mt-1 text-[11px] text-muted">
                              {customer.phone || "—"}
                            </p>
                          </td>

                          {/* LOCATION */}

                          <td className="px-5 py-3">
                            <p className="max-w-[130px] truncate text-xs font-semibold text-primary">
                              {customer.district || "—"}
                            </p>

                            <p className="mt-1 text-[11px] text-muted">
                              {customer.division || "—"}
                            </p>
                          </td>

                          {/* ORDERS */}

                          <td className="px-5 py-3">
                            <p className="text-sm font-bold text-primary">
                              {bn(customer.orderCount)}
                            </p>

                            <p className="text-[11px] text-muted">
                              Delivered: {bn(customer.deliveredOrders)}
                            </p>
                          </td>

                          {/* SPENT */}

                          <td className="whitespace-nowrap px-5 py-3 text-sm font-bold text-primary">
                            {money(customer.totalSpent)}
                          </td>

                          {/* LAST ORDER */}

                          <td className="px-5 py-3 text-xs text-primary">
                            {customer.lastOrderId ? (
                              <Link
                                className="font-semibold text-secondary hover:underline"
                                to={`/admin/orders/${encodeURIComponent(
                                  customer.lastOrderId,
                                )}`}
                              >
                                {dateText(customer.lastOrderAt)}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-3">
                            <AccountBadge status={customer.status} />
                          </td>

                          {/* DETAILS */}

                          <td className="px-5 py-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedUid(expanded ? null : customer.uid)
                              }
                              aria-expanded={expanded}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/10 px-3 py-2 text-xs font-bold text-secondary hover:bg-secondary/20"
                            >
                              <Eye size={14} />
                              Details
                              {expanded ? (
                                <ChevronUp size={13} />
                              ) : (
                                <ChevronDown size={13} />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* EXPANDED DETAILS */}

                        {expanded && (
                          <tr>
                            <td colSpan={8} className="bg-white px-5 py-3">
                              <CustomerExtra customer={customer} />
                            </td>
                          </tr>
                        )}
                      </FragmentRow>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ============================= */}
            {/* MOBILE CUSTOMER CARDS */}
            {/* ============================= */}

            <div className="space-y-3 p-3 sm:p-4 lg:hidden">
              {customers.map((customer) => {
                const expanded = expandedUid === customer.uid;

                return (
                  <article
                    key={customer.uid}
                    className="rounded-xl border border-base-300 bg-white p-3"
                  >
                    {/* CUSTOMER HEADER */}

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar customer={customer} size="size-12" />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-primary">
                            {customer.name || "Unnamed"}
                          </p>

                          <p className="mt-1 truncate text-[11px] text-muted">
                            {customer.email || "—"}
                          </p>
                        </div>
                      </div>

                      <AccountBadge status={customer.status} />
                    </div>

                    {/* CUSTOMER STATS */}

                    <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-base-200/70 p-3">
                      <div>
                        <p className="text-[11px] text-muted">Orders</p>

                        <p className="mt-1 text-sm font-bold text-primary">
                          {bn(customer.orderCount)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-muted">
                          Delivered Sales
                        </p>

                        <p className="mt-1 text-sm font-bold text-primary">
                          {money(customer.totalSpent)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-muted">Phone</p>

                        <p className="mt-1 text-xs font-semibold text-primary">
                          {customer.phone || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-muted">District</p>

                        <p className="mt-1 text-xs font-semibold text-primary">
                          {customer.district || "—"}
                        </p>
                      </div>
                    </div>

                    {/* EXPAND BUTTON */}

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedUid(expanded ? null : customer.uid)
                      }
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white"
                    >
                      <Eye size={15} />

                      {expanded ? "Hide Details" : "Customer Details"}
                    </button>

                    {expanded && (
                      <div className="mt-3">
                        <CustomerExtra customer={customer} />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {/* ============================= */}
            {/* EMPTY STATE */}
            {/* ============================= */}

            {customers.length === 0 && (
              <div className="py-12 text-center text-xs text-muted">
                কোনো Customer পাওয়া যায়নি। Search বা Filter পরিবর্তন করে দেখ।
              </div>
            )}

            {/* ============================= */}
            {/* PAGINATION */}
            {/* ============================= */}

            {total > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 p-4 sm:px-5">
                <p className="text-xs text-muted">
                  Showing {bn((page - 1) * PER_PAGE + 1)}
                  {"–"}
                  {bn(Math.min(page * PER_PAGE, total))}
                  {" of "}
                  {bn(total)}
                </p>

                <div className="flex items-center gap-2">
                  {/* PREVIOUS */}

                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={page <= 1}
                    onClick={() => {
                      setPage((previous) => Math.max(1, previous - 1));

                      setExpandedUid(null);
                    }}
                    className="flex size-9 items-center justify-center rounded-lg border border-base-300 text-primary disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* CURRENT PAGE */}

                  <span className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">
                    {page} / {totalPages}
                  </span>

                  {/* NEXT */}

                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={page >= totalPages}
                    onClick={() => {
                      setPage((previous) => Math.min(totalPages, previous + 1));

                      setExpandedUid(null);
                    }}
                    className="flex size-9 items-center justify-center rounded-lg border border-base-300 text-primary disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </section>

      {/* BUSINESS NOTE */}

      <p className="text-[11px] text-muted">
        Customer-এর Delivered Sales হলো delivered অর্ডারের মূল্য; verified
        payment বা cash collection নয়। Guest Orders আলাদা গণনা করা হয়।
      </p>
    </div>
  );
}
