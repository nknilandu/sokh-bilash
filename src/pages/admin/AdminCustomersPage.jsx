import { Fragment, useContext, useEffect, useState } from "react";
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
  MapPin,
  CalendarDays,
  X,
} from "lucide-react";

import { AuthContext } from "../../providers/AuthProvider";
import { API_URL } from "../../utils/siteConfig";

// ==========================================
// CONFIGURATION
// ==========================================

const PER_PAGE = 10;

const money = (value) =>
  `৳${(Number(value) || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const bn = (value) => Number(value || 0).toLocaleString("bn-BD");

function dateText(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("bn-BD", {
    timeZone: "Asia/Dhaka",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ==========================================
// CUSTOMER API
// GET /admin/customers
// ==========================================

async function getCustomers(user, filters, signal) {
  if (!user) throw new Error("Admin login required");

  const token = await user.getIdToken();

  const params = new URLSearchParams({
    page: String(filters.page),
    search: filters.search,
    status: filters.status,
    orders: filters.orders,
    sort: filters.sort,
  });

  const response = await fetch(`${API_URL}/admin/customers?${params}`, {
    method: "GET",
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

// ==========================================
// STATISTICS CARD
// ==========================================

function StatCard({ title, subtitle, value, icon: Icon, iconClass }) {
  return (
    <div className="rounded-xl border border-base-300/70 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
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

// ==========================================
// CUSTOMER AVATAR
// ==========================================

function Avatar({ customer, size = "size-10" }) {
  const [badUrl, setBadUrl] = useState("");

  const url = customer.photoUrl || "";

  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full border border-secondary/15 bg-secondary/10 text-secondary`}
    >
      {url && url !== badUrl ? (
        <img
          src={url}
          alt={customer.name || "Customer"}
          loading="lazy"
          onError={() => setBadUrl(url)}
          className="h-full w-full object-cover"
        />
      ) : (
        <UserRound size={20} />
      )}
    </div>
  );
}

// ==========================================
// ACCOUNT STATUS BADGE
// ==========================================

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

// ==========================================
// CUSTOMER EXTRA INFO FIELD
// ==========================================

function ExtraField({ label, icon: Icon, children }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[11px] text-muted">
        {Icon && <Icon size={13} className="shrink-0 text-secondary" />}

        {label}
      </p>

      <div className="mt-1 break-words text-xs font-semibold leading-5 text-primary">
        {children}
      </div>
    </div>
  );
}

// ==========================================
// EXPANDED CUSTOMER DETAILS
// ==========================================

function CustomerExtra({ customer }) {
  const lastOrder = customer.lastOrderId
    ? `/admin/orders/${encodeURIComponent(customer.lastOrderId)}`
    : "";

  return (
    <div className="grid gap-4 rounded-xl border border-secondary/15 bg-secondary/5 p-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
      {/* ADDRESS */}

      <ExtraField label="পূর্ণ ঠিকানা" icon={MapPin}>
        <p className="whitespace-pre-wrap">
          {customer.address || "সেভ করা নেই"}
        </p>

        <p className="mt-1 font-normal text-muted">
          {[customer.district, customer.division].filter(Boolean).join(", ") ||
            "—"}
        </p>
      </ExtraField>

      {/* REGISTRATION */}

      <ExtraField label="রেজিস্ট্রেশন" icon={CalendarDays}>
        <p>{dateText(customer.createdAt)}</p>

        <p className="mt-1 break-all font-normal text-muted">
          UID: {customer.uid || "—"}
        </p>
      </ExtraField>

      {/* ORDER SUMMARY */}

      <ExtraField label="অর্ডার সারাংশ" icon={ShoppingBag}>
        <p>
          মোট {bn(customer.orderCount)}টি / Delivered{" "}
          {bn(customer.deliveredOrders)}টি
        </p>

        <p className="mt-1 font-normal text-muted">
          Delivered Sales: {money(customer.totalSpent)}
        </p>

        <p className="mt-1 font-normal text-muted">
          শুধু Delivered Order Value; Cash Collection নয়
        </p>
      </ExtraField>

      {/* LAST ORDER */}

      <ExtraField label="সর্বশেষ অর্ডার" icon={CalendarDays}>
        {lastOrder ? (
          <>
            <p>{dateText(customer.lastOrderAt)}</p>

            <Link
              to={lastOrder}
              className="mt-2 inline-flex items-center gap-1 font-bold text-secondary hover:underline"
            >
              #{customer.lastOrderNumber || "Order"}
              <Eye size={13} />
            </Link>
          </>
        ) : (
          <p className="font-normal text-muted">এখনো অর্ডার করেননি</p>
        )}
      </ExtraField>
    </div>
  );
}

// ==========================================
// DESKTOP CUSTOMER ROW
// ==========================================

function CustomerRow({ customer, index, expanded, onToggle }) {
  return (
    <Fragment>
      <tr
        className={`transition hover:bg-secondary/5 ${
          index % 2 === 0 ? "bg-white" : "bg-[#faf7fb]"
        }`}
      >
        {/* CUSTOMER */}

        <td className="px-5 py-3 align-middle">
          <div className="flex min-w-[160px] items-center gap-2.5">
            <Avatar customer={customer} />

            <div className="min-w-0">
              <p
                title={customer.name || ""}
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

        <td className="px-5 py-3 align-middle">
          <p
            title={customer.email || ""}
            className="max-w-[180px] truncate text-xs text-primary"
          >
            {customer.email || "—"}
          </p>

          <p className="mt-1 text-[11px] text-muted">{customer.phone || "—"}</p>
        </td>

        {/* LOCATION */}

        <td className="px-5 py-3 align-middle">
          <p className="max-w-[130px] truncate text-xs font-semibold text-primary">
            {customer.district || "—"}
          </p>

          <p className="mt-1 text-[11px] text-muted">
            {customer.division || "—"}
          </p>
        </td>

        {/* ORDERS */}

        <td className="px-5 py-3 align-middle">
          <p className="text-sm font-bold text-primary">
            {bn(customer.orderCount)}
          </p>

          <p className="mt-1 text-[11px] text-muted">
            Delivered: {bn(customer.deliveredOrders)}
          </p>
        </td>

        {/* DELIVERED SALES */}

        <td className="whitespace-nowrap px-5 py-3 align-middle text-sm font-bold text-primary">
          {money(customer.totalSpent)}
        </td>

        {/* LAST ORDER */}

        <td className="px-5 py-3 align-middle text-xs text-primary">
          {customer.lastOrderId ? (
            <Link
              className="font-semibold text-secondary hover:underline"
              to={`/admin/orders/${encodeURIComponent(customer.lastOrderId)}`}
            >
              {dateText(customer.lastOrderAt)}
            </Link>
          ) : (
            "—"
          )}
        </td>

        {/* STATUS */}

        <td className="px-5 py-3 align-middle">
          <AccountBadge status={customer.status} />
        </td>

        {/* DETAILS */}

        <td className="px-5 py-3 text-right align-middle">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={`Customer details for ${
              customer.name || customer.email || "customer"
            }`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/10 px-3 py-2 text-xs font-bold text-secondary hover:bg-secondary/20"
          >
            <Eye size={14} />
            Details
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
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
    </Fragment>
  );
}

// ==========================================
// MOBILE CUSTOMER CARD
// ==========================================

function MobileCustomerCard({ customer, expanded, onToggle }) {
  return (
    <article className="rounded-xl border border-base-300 bg-white p-3">
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

          <p className="mt-1 text-[10px] text-muted">
            Delivered: {bn(customer.deliveredOrders)}
          </p>
        </div>

        <div>
          <p className="text-[11px] text-muted">Delivered Sales</p>

          <p className="mt-1 text-sm font-bold text-primary">
            {money(customer.totalSpent)}
          </p>
        </div>

        <div>
          <p className="text-[11px] text-muted">Phone</p>

          <p className="mt-1 break-words text-xs font-semibold text-primary">
            {customer.phone || "—"}
          </p>
        </div>

        <div>
          <p className="text-[11px] text-muted">District</p>

          <p className="mt-1 break-words text-xs font-semibold text-primary">
            {customer.district || "—"}
          </p>
        </div>
      </div>

      {/* DETAILS BUTTON */}

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white"
      >
        <Eye size={15} />

        {expanded ? "Hide Details" : "Customer Details"}

        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {expanded && (
        <div className="mt-3">
          <CustomerExtra customer={customer} />
        </div>
      )}
    </article>
  );
}

// ==========================================
// MAIN ADMIN CUSTOMERS PAGE
// ==========================================

export default function AdminCustomersPage() {
  // ========================================
  // AUTH CONTEXT
  // ========================================

  const auth = useContext(AuthContext) || {};

  const { user, loading } = auth;

  const currentRole = auth.role ?? auth.roleState?.role;

  const currentStatus = auth.accountStatus ?? auth.roleState?.status;

  const roleLoading = auth.roleLoading ?? auth.roleState?.checking ?? false;

  const checking = Boolean(loading || (user && roleLoading));

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

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [status, setStatus] = useState("all");

  const [ordersFilter, setOrdersFilter] = useState("all");

  const [sort, setSort] = useState("newest");

  const [expandedUid, setExpandedUid] = useState(null);

  // ========================================
  // SEARCH DEBOUNCE
  // ========================================

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(search.trim().slice(0, 80)),
      350,
    );

    return () => clearTimeout(timer);
  }, [search]);

  // ========================================
  // FETCH CUSTOMERS
  // ========================================

  const customerQuery = useQuery({
    queryKey: [
      "admin-customers",
      user?.uid,
      page,
      debouncedSearch,
      status,
      ordersFilter,
      sort,
    ],

    enabled: allowed,

    queryFn: ({ signal }) =>
      getCustomers(
        user,
        {
          page,
          search: debouncedSearch,
          status,
          orders: ordersFilter,
          sort,
        },
        signal,
      ),

    staleTime: 15000,
    refetchOnWindowFocus: true,
    refetchInterval: 60000,
    retry: 1,
  });

  // ========================================
  // BACKEND RESPONSE
  // ========================================

  const data = customerQuery.data || {};

  const customers = Array.isArray(data.customers) ? data.customers : [];

  const stats = data.stats || {};

  const pagination = data.pagination || {};

  const total = Number(pagination.total) || 0;

  const perPage = Number(pagination.limit) || PER_PAGE;

  const totalPages = Math.max(1, Number(pagination.totalPages) || 1);

  const currentPage = Math.max(1, Number(pagination.page) || page);

  // ========================================
  // FILTER HANDLERS
  // ========================================

  const changeFilter = (setter, value) => {
    setter(value);
    setPage(1);
    setExpandedUid(null);
  };

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("all");
    setOrdersFilter("all");
    setSort("newest");
    setPage(1);
    setExpandedUid(null);
  };

  const hasFilters = Boolean(
    search || status !== "all" || ordersFilter !== "all" || sort !== "newest",
  );

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
  // MAIN PAGE
  // ========================================

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-10">
      {/* PAGE HEADER */}

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

      {/* ==================================
          FIVE KPI CARDS
      ================================== */}

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
          subtitle="Orders, not accounts"
          value={stats.guestOrders}
          icon={ShoppingBag}
          iconClass="bg-amber-100 text-amber-800"
        />
      </section>

      {/* ==================================
          CUSTOMER LIST
      ================================== */}

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

        {/* ==================================
            SEARCH + FILTERS
        ================================== */}

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

            {search && (
              <button
                type="button"
                onClick={() => changeFilter(setSearch, "")}
                aria-label="Clear search"
                className="text-muted hover:text-secondary"
              >
                <X size={15} />
              </button>
            )}
          </label>

          {/* STATUS FILTER */}

          <select
            aria-label="Account status filter"
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
            aria-label="Order activity filter"
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
            aria-label="Sort customers"
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

        {/* ACTIVE FILTERS */}

        {hasFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-base-300 bg-secondary/5 px-4 py-2.5 sm:px-5">
            <p className="text-[11px] text-muted">
              বর্তমান Filter অনুযায়ী {bn(total)} জন Registered Customer
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline"
            >
              <RefreshCcw size={13} />
              Reset Filters
            </button>
          </div>
        )}

        {/* ==================================
            ERROR
        ================================== */}

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

        {/* ==================================
            CUSTOMER RESULTS
        ================================== */}

        {customerQuery.isPending ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-2 text-secondary">
            <Loader2 size={27} className="animate-spin" />

            <p className="text-xs text-muted">Customers লোড হচ্ছে...</p>
          </div>
        ) : !customerQuery.isError ? (
          <>
            {/* =============================
                DESKTOP TABLE
            ============================= */}

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
                  {customers.map((customer, index) => (
                    <CustomerRow
                      key={customer.uid}
                      customer={customer}
                      index={index}
                      expanded={expandedUid === customer.uid}
                      onToggle={() =>
                        setExpandedUid((current) =>
                          current === customer.uid ? null : customer.uid,
                        )
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* =============================
                MOBILE CUSTOMER CARDS
            ============================= */}

            <div className="space-y-3 p-3 sm:p-4 lg:hidden">
              {customers.map((customer) => (
                <MobileCustomerCard
                  key={customer.uid}
                  customer={customer}
                  expanded={expandedUid === customer.uid}
                  onToggle={() =>
                    setExpandedUid((current) =>
                      current === customer.uid ? null : customer.uid,
                    )
                  }
                />
              ))}
            </div>

            {/* =============================
                EMPTY STATE
            ============================= */}

            {customers.length === 0 && (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <Users size={30} className="text-secondary" />

                <p className="mt-3 text-sm font-semibold text-primary">
                  কোনো Customer পাওয়া যায়নি।
                </p>

                <p className="mt-1 text-xs text-muted">
                  Search বা Filter পরিবর্তন করে দেখুন।
                </p>

                {page > totalPages ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPage(totalPages);
                      setExpandedUid(null);
                    }}
                    className="mt-3 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white"
                  >
                    শেষ পেজে যান
                  </button>
                ) : (
                  hasFilters && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-3 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white"
                    >
                      Reset Filters
                    </button>
                  )
                )}
              </div>
            )}

            {/* =============================
                PAGINATION
            ============================= */}

            {total > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 p-4 sm:px-5">
                <p className="text-xs text-muted">
                  Showing {bn((currentPage - 1) * perPage + 1)}
                  {"–"}
                  {bn(Math.min(currentPage * perPage, total))}
                  {" of "}
                  {bn(total)}
                </p>

                <div className="flex items-center gap-2">
                  {/* PREVIOUS */}

                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={page <= 1 || customerQuery.isFetching}
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
                    {currentPage} / {totalPages}
                  </span>

                  {/* NEXT */}

                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={page >= totalPages || customerQuery.isFetching}
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

      <p className="text-[11px] leading-5 text-muted">
        Customer List-এ শুধু Registered Customer Account দেখানো হয়। Guest Orders
        হলো আলাদা অর্ডার সংখ্যা, Customer Account সংখ্যা নয়। Delivered Sales
        শুধু Delivered Orders-এর মোট মূল্য; প্রকৃত Payment Collection বা
        Refund-adjusted Net Revenue নয়। Account Status এখানে Read-only, কারণ
        বর্তমান Backend-এ Customer Status পরিবর্তনের Admin API নেই।
      </p>
    </div>
  );
}
