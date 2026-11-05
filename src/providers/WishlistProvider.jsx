import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { AuthContext } from "./AuthProvider";

// ==========================================
// CONFIGURATION
// ==========================================

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const STORAGE_KEY = "sokhbilash-wishlist";
const EVENT = "sokhbilash-wishlist-updated";

const MAX_ITEMS = 100;
const ID_PATTERN = /^[a-f0-9]{24}$/i;

export const WishlistContext = createContext(null);

// ==========================================
// LOCAL STORAGE HELPERS
// ==========================================

const cleanIds = (items) =>
  [
    ...new Set(
      (Array.isArray(items) ? items : [])
        .filter((id) => typeof id === "string" && ID_PATTERN.test(id.trim()))
        .map((id) => id.trim().toLowerCase()),
    ),
  ].slice(-MAX_ITEMS);

const readGuest = () => {
  try {
    return cleanIds(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  } catch {
    return [];
  }
};

const writeGuest = (ids) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanIds(ids)));

  window.dispatchEvent(
    new CustomEvent(EVENT, {
      detail: { source: "provider" },
    }),
  );
};

// ==========================================
// API REQUEST
// ==========================================

const request = async (path, { user, method = "GET", body, signal } = {}) => {
  const headers = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (user) {
    headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success !== true) {
    throw new Error(
      data.message || `Wishlist request failed (${response.status})`,
    );
  }

  return data;
};

// ==========================================
// FETCH GUEST PRODUCTS
// ==========================================

const fetchGuestProducts = async (signal) => {
  const productIds = readGuest();

  const products = [];
  const missingIds = [];

  // Fetch 10 products at a time.
  for (let start = 0; start < productIds.length; start += 10) {
    const batch = productIds.slice(start, start + 10);

    const results = await Promise.all(
      batch.map(async (id) => {
        const response = await fetch(`${API_URL}/products/${id}`, {
          signal,
          cache: "no-store",
        });

        if (response.status === 404) {
          return null;
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.success !== true) {
          throw new Error(data.message || "Guest wishlist load failed");
        }

        return data.product || null;
      }),
    );

    results.forEach((product, index) => {
      if (product) {
        products.push(product);
      } else {
        missingIds.push(batch[index]);
      }
    });
  }

  return {
    success: true,
    productIds,
    products,
    missingIds,
  };
};

// ==========================================
// MAIN WISHLIST PROVIDER
// ==========================================

export function WishlistProvider({ children }) {
  const { user, loading, role, roleLoading, accountStatus } =
    useContext(AuthContext);

  const queryClient = useQueryClient();

  const [savingId, setSavingId] = useState("");

  const uid = user?.uid || null;

  const guest = !loading && !user;

  const customer =
    Boolean(user) &&
    !roleLoading &&
    role === "customer" &&
    accountStatus === "active";

  const canWishlist = guest || customer;

  const authPending = loading || (Boolean(user) && roleLoading);

  const key = ["wishlist", uid || "guest"];

  // ========================================
  // GET WISHLIST + AUTO MERGE
  // ========================================

  const wishlistQuery = useQuery({
    queryKey: key,

    enabled: canWishlist,

    queryFn: async ({ signal }) => {
      // ==============================
      // GUEST
      // ==============================

      if (!user) {
        return fetchGuestProducts(signal);
      }

      // ==============================
      // LOGGED IN CUSTOMER
      // ==============================

      const pending = readGuest();

      if (pending.length) {
        const merged = await request("/wishlist/merge", {
          user,
          method: "POST",
          body: {
            productIds: pending,
          },
          signal,
        });

        // Remove only IDs included in
        // this successful merge request.
        // New pending IDs remain safe.

        const mergedSet = new Set(pending);

        writeGuest(readGuest().filter((id) => !mergedSet.has(id)));

        return merged;
      }

      return request("/wishlist", { user, signal });
    },

    staleTime: 30 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
  });

  // ========================================
  // STORAGE + CROSS TAB SYNC
  // ========================================

  useEffect(() => {
    const sync = (event) => {
      if (event?.detail?.source === "provider") {
        return;
      }

      if (!user || customer) {
        queryClient.invalidateQueries({
          queryKey: ["wishlist", uid || "guest"],
        });
      }
    };

    const storageSync = (event) => {
      if (event.key === STORAGE_KEY) {
        sync();
      }
    };

    window.addEventListener(EVENT, sync);

    window.addEventListener("storage", storageSync);

    return () => {
      window.removeEventListener(EVENT, sync);

      window.removeEventListener("storage", storageSync);
    };
  }, [user, customer, uid, queryClient]);

  // ========================================
  // CURRENT DATA
  // ========================================

  const data = wishlistQuery.data;

  const productIds = data?.productIds || [];
  const products = data?.products || [];
  const missingIds = data?.missingIds || [];

  const ready = canWishlist && wishlistQuery.isSuccess;

  // ========================================
  // TOGGLE WISHLIST
  // GUEST: LOCAL
  // CUSTOMER: MONGODB
  // ========================================

  const toggleWishlist = useCallback(
    async (item) => {
      if (!ready) {
        throw new Error("Wishlist এখনো প্রস্তুত নয়");
      }

      if (savingId) return;

      const id = String(
        typeof item === "string" ? item : item?._id || item?.id || "",
      ).toLowerCase();

      if (!ID_PATTERN.test(id)) {
        throw new Error("Invalid product ID");
      }

      const exists = productIds.includes(id);

      setSavingId(id);

      try {
        // =========================
        // GUEST LOCAL STORAGE
        // =========================

        if (!user) {
          writeGuest(
            exists
              ? readGuest().filter((saved) => saved !== id)
              : [...readGuest(), id],
          );

          await queryClient.invalidateQueries({
            queryKey: ["wishlist", "guest"],
          });
        } else {
          // =========================
          // CUSTOMER MONGODB
          // =========================

          const result = await request(`/wishlist/items/${id}`, {
            user,
            method: exists ? "DELETE" : "PUT",
          });

          queryClient.setQueryData(["wishlist", uid], result);
        }

        return !exists;
      } finally {
        setSavingId("");
      }
    },
    [ready, savingId, productIds, user, uid, queryClient],
  );

  // ========================================
  // CLEAR ALL WISHLIST
  // ========================================

  const clearWishlist = useCallback(async () => {
    if (!ready || savingId) return;

    setSavingId("all");

    try {
      if (!user) {
        writeGuest([]);

        queryClient.setQueryData(["wishlist", "guest"], {
          success: true,
          productIds: [],
          products: [],
          missingIds: [],
        });
      } else {
        const result = await request("/wishlist", {
          user,
          method: "DELETE",
        });

        queryClient.setQueryData(["wishlist", uid], result);
      }
    } finally {
      setSavingId("");
    }
  }, [ready, savingId, user, uid, queryClient]);

  // ========================================
  // REMOVE DELETED / UNPUBLISHED PRODUCTS
  // ========================================

  const removeMissing = useCallback(async () => {
    if (!ready || savingId || !missingIds.length) {
      return;
    }

    setSavingId("missing");

    try {
      if (!user) {
        const missingSet = new Set(missingIds);

        writeGuest(readGuest().filter((id) => !missingSet.has(id)));
      } else {
        for (const id of missingIds) {
          await request(`/wishlist/items/${id}`, {
            user,
            method: "DELETE",
          });
        }
      }

      await queryClient.invalidateQueries({
        queryKey: ["wishlist", uid || "guest"],
      });
    } finally {
      setSavingId("");
    }
  }, [ready, savingId, missingIds, user, uid, queryClient]);

  // ========================================
  // CONTEXT VALUE
  // ========================================

  const wishlistData = {
    productIds,
    products,
    missingIds,

    ready,
    canWishlist,
    authPending,
    isGuest: guest,

    loading: canWishlist && wishlistQuery.isPending,

    isError: wishlistQuery.isError,
    error: wishlistQuery.error,
    savingId,

    isFavorite: (id) => productIds.includes(String(id || "").toLowerCase()),

    toggleWishlist,
    clearWishlist,
    removeMissing,

    refetch: wishlistQuery.refetch,
  };

  return (
    <WishlistContext.Provider value={wishlistData}>
      {children}
    </WishlistContext.Provider>
  );
}

// ==========================================
// CUSTOM HOOK
// ==========================================

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("Wrap your app in WishlistProvider");
  }

  return context;
}
