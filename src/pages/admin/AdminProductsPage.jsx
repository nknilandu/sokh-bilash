
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Swal from "sweetalert2";

import {
  Plus,
  Search,
  Package,
  CheckCircle2,
  XCircle,
  Star,
  Pencil,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  ImageOff,
  Layers3,
  ShieldCheck,
  ArrowUpDown,
} from "lucide-react";
import { AuthContext } from "../../providers/AuthProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";


const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const money = (value) =>
  `৳${Number(value || 0).toLocaleString("bn-BD")}`;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("bn-BD", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

// ================= STAT CARD =================
function StatCard({ title, value, icon: Icon, iconClass, note }) {
  return (
    <div className="rounded-2xl border border-base-300/80 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">
            {title}
          </p>
          <p className="mt-1 text-xs text-muted">
            {note}
          </p>
        </div>

        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={21} />
        </span>
      </div>

      <p className="mt-4 text-xl font-bold text-primary">
        {Number(value || 0).toLocaleString("bn-BD")}
      </p>
    </div>
  );
}

// ================= PRODUCT IMAGE =================

function ProductImage({ product }) {
  const [failed, setFailed] = useState(false);

  const image = product.images?.[0];

  const src = typeof image === "string"
    ? image
    : image?.url || "";

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-base-300 bg-base-200">
      {src && !failed ? (
        <img
          src={src}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <ImageOff size={21} className="text-muted" />
      )}
    </div>
  );
}

// ================= AVAILABILITY BADGE =================

function AvailabilityBadge({ available }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        available
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {available ? (
        <CheckCircle2 size={14} />
      ) : (
        <XCircle size={14} />
      )}

      {available ? "Available" : "Unavailable"}
    </span>
  );
}

// ================= MAIN PAGE =================

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    user,
    loading: authLoading,
    role,
    roleLoading,
    accountStatus,
  } = useContext(AuthContext);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const isAdmin =
    !!user &&
    role === "admin" &&
    accountStatus === "active";

  // ================= SEARCH DEBOUNCE =================

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // ================= GET CATEGORIES =================

  const { data: categoryData } = useQuery({
    queryKey: ["catalogCategories"],
    enabled: isAdmin,
    queryFn: async () => {
      const res = await fetch(`${API_URL}/categories`);

      if (!res.ok) {
        throw new Error("Failed to fetch categories");
      }

      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const categories = categoryData?.categories || [];

  const categoryMap = Object.fromEntries(
    categories.map((item) => [item.id, item.name])
  );

  // ================= GET ADMIN PRODUCTS =================

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "adminProducts",
      debouncedSearch,
      status,
      category,
      sort,
      page,
    ],

    enabled: isAdmin && !authLoading && !roleLoading,

    queryFn: async ({ signal }) => {
      const token = await user.getIdToken();

      const params = new URLSearchParams({
        search: debouncedSearch,
        status,
        category,
        sort,
        page: String(page),
        limit: "10",
      });

      const res = await fetch(
        `${API_URL}/admin/products?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal,
        }
      );

      const result = await res.json().catch(() => ({}));

      if (!res.ok || !result.success) {
        throw new Error(
          result.message || "Failed to fetch products"
        );
      }

      return result;
    },

    staleTime: 10000,
    refetchOnWindowFocus: true,
  });

  const products = data?.products || [];

  const stats = data?.stats || {
    total: 0,
    available: 0,
    unavailable: 0,
    featured: 0,
  };

  const pagination = data?.pagination || {
    page: 1,
    total: 0,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  // Keep page valid after filters or deletion
  useEffect(() => {
    if (data?.pagination && page > data.pagination.totalPages) {
      setPage(data.pagination.totalPages);
    }
  }, [data, page]);

  // ================= UPDATE AVAILABILITY =================

  const toggleAvailability = async (product, available) => {
    if (updatingId || deletingId) return;

    setUpdatingId(product._id);

    try {
      const token = await user.getIdToken();

      const res = await fetch(
        `${API_URL}/admin/products/${product._id}/availability`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ available }),
        }
      );

      const result = await res.json().catch(() => ({}));

      if (!res.ok || !result.success) {
        throw new Error(
          result.message || "Availability update failed"
        );
      }

      await queryClient.invalidateQueries({
        queryKey: ["adminProducts"],
      });

      Swal.fire({
        title: available
          ? "প্রোডাক্ট Available করা হয়েছে!"
          : "প্রোডাক্ট Unavailable করা হয়েছে!",
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });

    } catch (error) {
      Swal.fire({
        title: error.message,
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });

    } finally {
      setUpdatingId(null);
    }
  };

  // ================= DELETE PRODUCT =================

  const handleDelete = async (product) => {
    if (updatingId || deletingId) return;

    const confirmation = await Swal.fire({
      title: "প্রোডাক্ট ডিলিট করবেন?",
      text: `${product.name} স্থায়ীভাবে মুছে যাবে।`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, ডিলিট করুন",
      cancelButtonText: "বাতিল",
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#76258A",
    });

    if (!confirmation.isConfirmed) return;

    setDeletingId(product._id);

    try {
      const token = await user.getIdToken();

      const res = await fetch(
        `${API_URL}/admin/products/${product._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await res.json().catch(() => ({}));

      if (!res.ok || !result.success) {
        throw new Error(
          result.message || "Product delete failed"
        );
      }

      // If last product on the page is deleted,
      // move to the previous page.
      if (products.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      }

      await queryClient.invalidateQueries({
        queryKey: ["adminProducts"],
      });

      Swal.fire({
        title: "প্রোডাক্ট সফলভাবে ডিলিট হয়েছে!",
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });

    } catch (error) {
      Swal.fire({
        title: error.message,
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });

    } finally {
      setDeletingId(null);
    }
  };

  // ================= FILTER HANDLERS =================

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("all");
    setCategory("all");
    setSort("newest");
    setPage(1);
  };

  const tabs = [
    { id: "all", label: "সব প্রোডাক্ট", count: stats.total },
    { id: "available", label: "Available", count: stats.available },
    { id: "unavailable", label: "Unavailable", count: stats.unavailable },
    { id: "featured", label: "Featured", count: stats.featured },
  ];

  const totalPages = pagination.totalPages;

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  ).filter(
    (number) =>
      number === 1 ||
      number === totalPages ||
      Math.abs(number - page) <= 1
  );

  // ================= AUTH LOADING =================

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <LoaderCircle
          size={30}
          className="animate-spin text-secondary"
        />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <ShieldCheck
          size={30}
          className="mx-auto text-red-500"
        />
        <p className="mt-3 text-sm font-bold text-red-700">
          এই পেজটি শুধু Admin-এর জন্য।
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-10">

      {/* ================= PAGE HEADER ================= */}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-[#4b1558] to-secondary p-5 text-white shadow-md sm:p-6">

        <div className="absolute -right-10 -top-14 size-44 rounded-full bg-white/5" />
        <div className="absolute bottom-0 right-32 size-24 rounded-full bg-gold-soft/10 blur-xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-5">

          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-gold-soft">
              <Layers3 size={14} />
              Catalog Management
            </span>

            <h1 className="text-xl font-bold sm:text-2xl">
              প্রোডাক্ট ম্যানেজমেন্ট
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">
              আপনার স্টোরের প্রোডাক্ট, মূল্য, availability এবং featured collection পরিচালনা করুন।
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/products/add")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold-soft px-5 py-3 text-sm font-bold text-primary shadow-sm transition hover:bg-[#ffe990]"
          >
            <Plus size={18} />
            নতুন প্রোডাক্ট যোগ করুন
          </button>
        </div>
      </div>

      {/* ================= KPI CARDS ================= */}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          title="মোট প্রোডাক্ট"
          note="Total Products"
          value={stats.total}
          icon={Package}
          iconClass="bg-secondary/10 text-secondary"
        />

        <StatCard
          title="Available"
          note="ক্রয়যোগ্য প্রোডাক্ট"
          value={stats.available}
          icon={CheckCircle2}
          iconClass="bg-green-50 text-green-700"
        />

        <StatCard
          title="Unavailable"
          note="ক্রয়যোগ্য নয়"
          value={stats.unavailable}
          icon={XCircle}
          iconClass="bg-red-50 text-red-600"
        />

        <StatCard
          title="Featured"
          note="বিশেষভাবে নির্বাচিত"
          value={stats.featured}
          icon={Star}
          iconClass="bg-amber-50 text-amber-700"
        />
      </div>

      {/* ================= PRODUCT LIST ================= */}

      <section className="overflow-hidden rounded-2xl border border-base-300/80 bg-white shadow-sm">

        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 p-4 sm:p-5">
          <div>
            <h2 className="text-base font-bold text-primary">
              প্রোডাক্ট তালিকা
            </h2>

            <p className="mt-1 text-xs text-muted">
              সার্চ, ফিল্টার ও প্রোডাক্টের তথ্য পরিচালনা
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isFetching && (
              <LoaderCircle
                size={17}
                className="animate-spin text-secondary"
              />
            )}

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-2 rounded-lg border border-base-300 px-3 py-2 text-sm font-medium text-secondary hover:bg-base-200 disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* ================= STATUS TABS ================= */}

        <div className="flex gap-2 overflow-x-auto border-b border-base-300 px-4 py-3 sm:px-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatus(tab.id);
                setPage(1);
              }}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                status === tab.id
                  ? "bg-primary text-white"
                  : "bg-base-200 text-primary/70 hover:bg-secondary/10"
              }`}
            >
              {tab.label}

              <span
                className={`rounded-md px-2 py-0.5 text-xs ${
                  status === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-white text-secondary"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ================= SEARCH + FILTERS ================= */}

        <div className="grid gap-3 border-b border-base-300 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[minmax(0,1fr)_220px_190px_auto]">

          {/* Search */}
          <label className="flex h-11 min-w-0 items-center gap-2 rounded-xl border border-base-300 bg-base-200 px-3 focus-within:border-secondary focus-within:bg-white">
            <Search size={19} className="shrink-0 text-secondary" />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="বাংলা, English, Banglish, SKU..."
              className="min-w-0 flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-muted"
            />
          </label>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
            className="h-11 min-w-0 rounded-xl border border-base-300 bg-base-200 px-3 text-sm text-primary outline-none focus:border-secondary"
          >
            <option value="all">সব ক্যাটাগরি</option>

            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          {/* Sorting */}
          <label className="flex h-11 items-center gap-2 rounded-xl border border-base-300 bg-base-200 px-3">
            <ArrowUpDown
              size={16}
              className="shrink-0 text-secondary"
            />

            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
              className="w-full min-w-0 bg-transparent text-sm text-primary outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="name">Name A–Z</option>
            </select>
          </label>

          {/* Reset */}
          <button
            type="button"
            onClick={resetFilters}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-secondary/20 bg-secondary/5 px-4 text-sm font-semibold text-secondary transition hover:bg-secondary/10"
          >
            <RefreshCw size={16} />
            Reset
          </button>
        </div>

        {/* ================= RESULT BAR ================= */}

        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#faf7fc] px-4 py-3 sm:px-5">
          <p className="text-sm text-primary">
            মোট ফলাফল:{" "}
            <span className="font-bold text-secondary">
              {pagination.total.toLocaleString("bn-BD")}টি
            </span>
          </p>

          <span className="text-xs text-muted">
            প্রতি পেজে ১০টি প্রোডাক্ট
          </span>
        </div>

        {/* ================= LOADING ================= */}

        {isLoading && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3">
            <LoaderCircle
              size={32}
              className="animate-spin text-secondary"
            />
            <p className="text-sm text-muted">
              প্রোডাক্ট লোড হচ্ছে...
            </p>
          </div>
        )}

        {/* ================= ERROR ================= */}

        {isError && !isLoading && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-4 text-center">
            <XCircle size={34} className="text-red-500" />

            <p className="text-sm font-semibold text-red-600">
              {error?.message || "প্রোডাক্ট লোড করা যায়নি"}
            </p>

            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        )}

        {/* ================= TABLE ================= */}

        {!isLoading && !isError && (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1010px] border-collapse text-left">

                <thead className="bg-[#f3ecf6]">
                  <tr className="text-xs font-bold text-primary">
                    <th className="px-4 py-4">প্রোডাক্ট</th>
                    <th className="px-4 py-4">ক্যাটাগরি</th>
                    <th className="px-4 py-4">মূল্য</th>
                    <th className="px-4 py-4">Availability</th>
                    <th className="px-4 py-4">Featured</th>
                    <th className="px-4 py-4">তারিখ</th>
                    <th className="px-4 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product, index) => (
                    <tr
                      key={product._id}
                      className={`border-b border-base-300/60 transition hover:bg-secondary/5 ${
                        index % 2 === 0
                          ? "bg-white"
                          : "bg-[#fbf8fc]"
                      }`}
                    >
                      {/* Product */}
                      <td className="px-4 py-4">
                        <div className="flex min-w-[230px] items-center gap-3">
                          <ProductImage product={product} />

                          <div className="min-w-0">
                            <p className="line-clamp-2 max-w-64 text-sm font-bold text-primary">
                              {product.name}
                            </p>

                            <p className="mt-1 text-xs text-muted">
                              SKU: {product.sku}
                            </p>

                            {product.customizable && (
                              <span className="mt-1 inline-flex rounded-md bg-secondary/10 px-2 py-0.5 text-xs text-secondary">
                                Customizable
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4 text-sm text-primary">
                        {categoryMap[product.categoryId] ||
                          product.categoryId ||
                          "—"}
                      </td>

                      {/* Price */}
                      <td className="px-4 py-4">
                        <p className="whitespace-nowrap text-sm font-bold text-primary">
                          {money(
                            product.salePrice ??
                              product.regularPrice
                          )}
                        </p>

                        {product.salePrice != null && (
                          <p className="mt-1 text-xs text-muted line-through">
                            {money(product.regularPrice)}
                          </p>
                        )}
                      </td>

                      {/* Availability */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={product.available === true}
                            disabled={!!updatingId || !!deletingId}
                            onChange={(event) =>
                              toggleAvailability(
                                product,
                                event.target.checked
                              )
                            }
                            aria-label={`Availability for ${product.name}`}
                            className="toggle toggle-sm toggle-success"
                          />

                          <AvailabilityBadge
                            available={product.available === true}
                          />
                        </div>
                      </td>

                      {/* Featured */}
                      <td className="px-4 py-4">
                        {product.featured ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-gold-soft/50 px-2.5 py-1.5 text-xs font-semibold text-primary">
                            <Star size={14} />
                            Featured
                          </span>
                        ) : (
                          <span className="text-sm text-muted">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-muted">
                        {formatDate(product.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/admin/products/edit/${product._id}`
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/10 px-3 py-2 text-sm font-medium text-secondary transition hover:bg-secondary hover:text-white"
                          >
                            <Pencil size={15} />
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={!!deletingId || !!updatingId}
                            onClick={() => handleDelete(product)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
                          >
                            {deletingId === product._id ? (
                              <LoaderCircle
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={15} />
                            )}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ================= MOBILE CARDS ================= */}

            <div className="space-y-3 p-3 lg:hidden">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="rounded-xl border border-base-300 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <ProductImage product={product} />

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-bold text-primary">
                        {product.name}
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        {product.sku}
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        {categoryMap[product.categoryId] || "—"}
                      </p>

                      <p className="mt-2 text-sm font-bold text-secondary">
                        {money(
                          product.salePrice ??
                            product.regularPrice
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-base-200 p-3">
                    <AvailabilityBadge
                      available={product.available === true}
                    />

                    <input
                      type="checkbox"
                      checked={product.available === true}
                      disabled={!!updatingId || !!deletingId}
                      onChange={(event) =>
                        toggleAvailability(
                          product,
                          event.target.checked
                        )
                      }
                      className="toggle toggle-sm toggle-success"
                      aria-label={`Availability for ${product.name}`}
                    />
                  </div>

                  {product.featured && (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-secondary">
                      <Star size={14} />
                      Featured Product
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/admin/products/edit/${product._id}`
                        )
                      }
                      className="flex items-center justify-center gap-2 rounded-lg bg-secondary/10 px-3 py-2.5 text-sm font-medium text-secondary"
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={!!deletingId || !!updatingId}
                      onClick={() => handleDelete(product)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ================= EMPTY STATE ================= */}

            {products.length === 0 && (
              <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                <span className="flex size-16 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <Package size={30} />
                </span>

                <p className="mt-4 text-base font-bold text-primary">
                  কোনো প্রোডাক্ট পাওয়া যায়নি
                </p>

                <p className="mt-2 text-sm text-muted">
                  সার্চ বা ফিল্টার পরিবর্তন করে দেখুন।
                </p>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-white"
                >
                  ফিল্টার রিসেট করুন
                </button>
              </div>
            )}

            {/* ================= PAGINATION ================= */}

            {pagination.total > 0 && (
              <div className="flex flex-col gap-3 border-t border-base-300 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-sm text-muted">
                  {(
                    (pagination.page - 1) * 10 + 1
                  ).toLocaleString("bn-BD")}
                  {" – "}
                  {Math.min(
                    pagination.page * 10,
                    pagination.total
                  ).toLocaleString("bn-BD")}
                  {" / "}
                  {pagination.total.toLocaleString("bn-BD")}
                  {"টি প্রোডাক্ট"}
                </p>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={!pagination.hasPreviousPage}
                    onClick={() =>
                      setPage((prev) => Math.max(1, prev - 1))
                    }
                    className="flex size-9 items-center justify-center rounded-lg border border-base-300 text-primary hover:bg-base-200 disabled:opacity-40"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {pageNumbers.map((number, index) => (
                    <div key={number} className="flex items-center gap-1.5">
                      {index > 0 &&
                        number - pageNumbers[index - 1] > 1 && (
                          <span className="px-1 text-sm text-muted">
                            ...
                          </span>
                        )}

                      <button
                        type="button"
                        onClick={() => setPage(number)}
                        className={`flex size-9 items-center justify-center rounded-lg text-sm font-semibold transition ${
                          page === number
                            ? "bg-secondary text-white"
                            : "bg-base-200 text-primary hover:bg-secondary/10"
                        }`}
                      >
                        {number}
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    disabled={!pagination.hasNextPage}
                    onClick={() =>
                      setPage((prev) => prev + 1)
                    }
                    className="flex size-9 items-center justify-center rounded-lg border border-base-300 text-primary hover:bg-base-200 disabled:opacity-40"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
