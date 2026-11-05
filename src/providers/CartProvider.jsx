import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getAuth } from "firebase/auth";
import { app } from "../../firebase/firebase.config";
import { AuthContext } from "./AuthProvider";

export const CartContext = createContext(null);

// ==========================================
// CONFIGURATION
// ==========================================

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const GUEST_CART_KEY = "sokhbilash-cart";
const MERGE_ID_KEY = "sokhbilash-cart-merge-id";
const ACCOUNT_SYNC_KEY = "sokhbilash-cart-account-sync";

const MAX_ITEMS = 100;
const MAX_QUANTITY = 10;

const firebaseAuth = getAuth(app);

// ==========================================
// COMMON HELPERS
// ==========================================

const generateId = () => {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `skb-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
  );
};

const getProductId = (item) => String(item?.productId || item?.id || "").trim();

const getPrice = (item) => {
  const price = Number(item?.unitPrice ?? item?.price ?? 0);

  return Number.isFinite(price) && price >= 0 ? price : 0;
};

const asText = (value) => (typeof value === "string" ? value : "");

// ==========================================
// READ GUEST CART
// ==========================================

const readGuestCart = () => {
  try {
    const saved = localStorage.getItem(GUEST_CART_KEY);

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item) => item && typeof item === "object" && !Array.isArray(item),
    );
  } catch (error) {
    console.error("Read Guest Cart:", error);
    return [];
  }
};

// ==========================================
// CART ITEM NORMALIZATION
// ==========================================

const prepareCartItem = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Invalid cart item.");
  }

  const productId = getProductId(input);

  if (!/^[a-f0-9]{24}$/i.test(productId)) {
    throw new Error("Invalid product ID.");
  }

  const quantity = Number(input.quantity ?? 1);

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    throw new Error(`Quantity must be between 1 and ${MAX_QUANTITY}.`);
  }

  const originalCustomization = input.customization || {};

  const mode = ["frame", "note"].includes(originalCustomization.mode)
    ? originalCustomization.mode
    : "none";

  const photos =
    mode === "frame" && Array.isArray(originalCustomization.photos)
      ? originalCustomization.photos.map((photo) => ({
          id: asText(photo?.id) || generateId(),
          name: asText(photo?.name),
          size: Number(photo?.size) || 0,
          url: asText(photo?.url),
        }))
      : [];

  if (
    photos.length > 20 ||
    photos.some((photo) => {
      try {
        return new URL(photo.url).protocol !== "https:";
      } catch {
        return true;
      }
    })
  ) {
    throw new Error(
      "Invalid uploaded photos. Only valid HTTPS image URLs are supported.",
    );
  }

  const customization = {
    mode,

    name: mode === "frame" ? asText(originalCustomization.name).trim() : "",

    date: mode === "frame" ? asText(originalCustomization.date) : "",

    message:
      mode === "frame" ? asText(originalCustomization.message).trim() : "",

    note: mode === "note" ? asText(originalCustomization.note).trim() : "",

    photos,
  };

  const price = getPrice(input);

  return {
    cartId:
      typeof input.cartId === "string" &&
      /^[a-zA-Z0-9_-]{8,128}$/.test(input.cartId)
        ? input.cartId
        : generateId(),

    productId,
    id: productId,

    slug: asText(input.slug),
    name: asText(input.name),
    sku: asText(input.sku),
    image: asText(input.image),

    price,
    unitPrice: price,
    quantity,

    variantKey: asText(input.variantKey),

    selectedOptions:
      input.selectedOptions &&
      typeof input.selectedOptions === "object" &&
      !Array.isArray(input.selectedOptions)
        ? { ...input.selectedOptions }
        : {},

    packaging: input.packaging === "premium" ? "premium" : "regular",

    premiumBoxPrice: Number(input.premiumBoxPrice) || 0,

    surpriseBox: input.surpriseBox === true,

    customization,

    addedAt: asText(input.addedAt) || new Date().toISOString(),
  };
};

// ==========================================
// SAME CONFIGURATION CHECK
// ==========================================

const configurationOf = (item) => {
  const custom = item?.customization || {};

  return {
    productId: getProductId(item),

    variantKey: item?.variantKey || "",

    packaging: item?.packaging || "regular",

    surpriseBox: item?.surpriseBox === true,

    mode: custom.mode || "none",

    name: custom.name || "",
    date: custom.date || "",
    message: custom.message || "",
    note: custom.note || "",

    photoUrls: Array.isArray(custom.photos)
      ? custom.photos.map((photo) => photo.url)
      : [],
  };
};

const isSameConfiguration = (first, second) =>
  JSON.stringify(configurationOf(first)) ===
  JSON.stringify(configurationOf(second));

// ==========================================
// GUEST CART STORAGE
// ==========================================

const saveGuestCart = (items) => {
  try {
    if (!Array.isArray(items)) {
      throw new Error("Invalid guest cart.");
    }

    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));

    // Every guest mutation creates a new merge operation.
    localStorage.setItem(MERGE_ID_KEY, generateId());

    window.dispatchEvent(new Event("sokhbilash-cart-updated"));

    return items;
  } catch (error) {
    console.error("Save Guest Cart:", error);
    throw new Error("Browser storage unavailable. Could not save your cart.");
  }
};

const getOrCreateMergeId = () => {
  const existing = localStorage.getItem(MERGE_ID_KEY);

  if (existing) return existing;

  const id = generateId();

  localStorage.setItem(MERGE_ID_KEY, id);

  return id;
};

// ==========================================
// API HELPER
// ==========================================

const cartRequest = async (
  firebaseUser,
  endpoint,
  { method = "GET", body } = {},
) => {
  if (!firebaseUser) {
    throw new Error("Authentication required.");
  }

  const token = await firebaseUser.getIdToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,

    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },

    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),

    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success !== true) {
    const error = new Error(
      data.message || `Cart request failed (${response.status}).`,
    );

    error.status = response.status;

    throw error;
  }

  return data;
};

// ==========================================
// CROSS-TAB ACCOUNT CART NOTIFICATION
// ==========================================

const notifyAccountUpdated = (uid) => {
  try {
    localStorage.setItem(
      ACCOUNT_SYNC_KEY,
      JSON.stringify({
        uid,
        id: generateId(),
        updatedAt: Date.now(),
      }),
    );
  } catch (error) {
    // Cart is already saved in MongoDB.
    // Browser notification failure is not a cart failure.
    console.warn("Account cart notification:", error.message);
  }
};

// ==========================================
// CART PROVIDER
// ==========================================

const CartProvider = ({ children }) => {
  const {
    user,
    loading: authLoading,
    role,
    roleLoading,
    accountStatus,
  } = useContext(AuthContext);

  const uid = user?.uid || null;

  // Guest means Firebase user is not logged in.
  const isGuest = !authLoading && !user;

  // Only active customers can use MongoDB cart.
  const isActiveCustomer =
    Boolean(uid) &&
    !roleLoading &&
    role === "customer" &&
    accountStatus === "active";

  // Guest and active customers can shop.
  const canShop = !authLoading && !roleLoading && (isGuest || isActiveCustomer);

  // Guest cart belongs to this browser.
  const [guestItems, setGuestItems] = useState(readGuestCart);

  // Account cart belongs to Firebase UID.
  const [accountCart, setAccountCart] = useState({
    uid: null,
    items: [],
    version: 0,
  });

  const [syncState, setSyncState] = useState({
    uid: null,
    status: "idle",
    error: "",
  });

  const [mutationError, setMutationError] = useState("");

  const [retryNumber, setRetryNumber] = useState(0);

  const mutationQueueRef = useRef(Promise.resolve());

  // ==========================================
  // SESSION HELPERS
  // ==========================================

  const sessionMatches = useCallback((targetUid) => {
    return firebaseAuth.currentUser?.uid === targetUid;
  }, []);

  const applyAccountCart = useCallback(
    (targetUid, result) => {
      if (!sessionMatches(targetUid)) {
        return;
      }

      const cart = result?.cart || result;

      if (!Array.isArray(cart?.items)) {
        throw new Error("Invalid cart response from server.");
      }

      setAccountCart({
        uid: targetUid,
        items: cart.items,
        version: cart.version ?? 0,
      });

      setMutationError("");
    },
    [sessionMatches],
  );

  // ==========================================
  // SERIALIZE ACCOUNT MUTATIONS
  // ==========================================

  const enqueueMutation = useCallback((task) => {
    const operation = mutationQueueRef.current.catch(() => {}).then(task);

    mutationQueueRef.current = operation.then(
      () => undefined,
      () => undefined,
    );

    return operation;
  }, []);

  // ==========================================
  // INITIAL SYNC + GUEST MERGE
  // ==========================================

  useEffect(() => {
    // Wait until Firebase and MongoDB role are ready.
    if (authLoading || roleLoading) {
      return undefined;
    }

    // GUEST CART
    if (!uid || !user) {
      setAccountCart({
        uid: null,
        items: [],
        version: 0,
      });

      setGuestItems(readGuestCart());

      setSyncState({
        uid: null,
        status: "ready",
        error: "",
      });

      setMutationError("");

      return undefined;
    }

    // ADMIN / INACTIVE / DISABLED ACCOUNT
    if (!isActiveCustomer) {
      setAccountCart({
        uid,
        items: [],
        version: 0,
      });

      setSyncState({
        uid,
        status: "blocked",
        error: "এই অ্যাকাউন্ট দিয়ে কেনাকাটা করা যাবে না।",
      });

      setMutationError("");

      // Important: Never delete the guest cart here.
      return undefined;
    }

    let cancelled = false;
    let retryTimer = null;
    let attempts = 0;

    const targetUid = uid;
    const firebaseUser = user;

    setAccountCart({
      uid: targetUid,
      items: [],
      version: 0,
    });

    setSyncState({
      uid: targetUid,
      status: "loading",
      error: "",
    });

    setMutationError("");

    const sync = async () => {
      try {
        if (cancelled || !sessionMatches(targetUid)) {
          return;
        }

        const localItems = readGuestCart();

        let result;

        if (localItems.length > 0) {
          // Keep this ID stable across retries.
          const mergeId = getOrCreateMergeId();

          const savedSnapshot = JSON.stringify(localItems);

          result = await cartRequest(firebaseUser, "/cart/merge", {
            method: "POST",
            body: {
              mergeId,
              items: localItems,
            },
          });

          if (cancelled || !sessionMatches(targetUid)) {
            return;
          }

          // Never delete a guest cart if it was
          // modified while the request was running.
          const currentSnapshot = JSON.stringify(readGuestCart());

          const currentMergeId = localStorage.getItem(MERGE_ID_KEY);

          if (currentSnapshot === savedSnapshot && currentMergeId === mergeId) {
            localStorage.removeItem(GUEST_CART_KEY);

            localStorage.removeItem(MERGE_ID_KEY);

            setGuestItems([]);

            window.dispatchEvent(new Event("sokhbilash-cart-updated"));
          } else {
            // Preserve changed guest data.
            // Block further account mutations until
            // the guest data has been reconciled.
            throw new Error(
              "Guest cart changed during synchronization. Please review the cart and retry.",
            );
          }
        } else {
          result = await cartRequest(firebaseUser, "/cart");
        }

        if (cancelled || !sessionMatches(targetUid)) {
          return;
        }

        applyAccountCart(targetUid, result);

        setSyncState({
          uid: targetUid,
          status: "ready",
          error: "",
        });
      } catch (error) {
        if (cancelled || !sessionMatches(targetUid)) {
          return;
        }

        console.error("Cart Synchronization:", error.message);

        // During registration Firebase may create
        // the user before MongoDB user creation
        // finishes. Retry instead of losing cart data.
        if (error.status === 404 && attempts < 12) {
          attempts += 1;

          retryTimer = setTimeout(sync, 2000);

          return;
        }

        setSyncState({
          uid: targetUid,
          status: "error",
          error: error.message || "Cart synchronization failed.",
        });
      }
    };

    sync();

    return () => {
      cancelled = true;

      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [
    uid,
    user,
    authLoading,
    roleLoading,
    isActiveCustomer,
    retryNumber,
    sessionMatches,
    applyAccountCart,
  ]);

  // ==========================================
  // CART SESSION STATE
  // ==========================================

  // ==========================================
  // CART SESSION STATE
  // ==========================================

  const isAuthenticated = Boolean(uid);

  const isAccountReady =
    isActiveCustomer && syncState.uid === uid && syncState.status === "ready";

  const cartLoading =
    authLoading ||
    roleLoading ||
    (isActiveCustomer &&
      (syncState.uid !== uid || syncState.status === "loading"));

  const cartReady = canShop && (isGuest || isAccountReady);

  const cartError =
    uid && !roleLoading && !isActiveCustomer
      ? "এই অ্যাকাউন্ট দিয়ে Shopping Cart ব্যবহার করা যাবে না।"
      : (syncState.uid === uid ? syncState.error : "") || mutationError;

  const items = useMemo(() => {
    if (isGuest) {
      return guestItems;
    }

    if (isActiveCustomer && accountCart.uid === uid) {
      return accountCart.items;
    }

    // Admin / inactive accounts should see no cart.
    return [];
  }, [isGuest, isActiveCustomer, uid, guestItems, accountCart]);

  // ==========================================
  // UPDATE GUEST CART
  // ==========================================

  const updateGuestCart = useCallback(
    (updater) => {
      if (!isGuest || !canShop) {
        throw new Error("এই অ্যাকাউন্ট দিয়ে Cart পরিবর্তন করা যাবে না।");
      }

      const current = readGuestCart();
      const next = updater(current);

      saveGuestCart(next);
      setGuestItems(next);
      setMutationError("");

      return next;
    },
    [isGuest, canShop],
  );

  // ==========================================
  // REQUEST GUARD
  // ==========================================
  const ensureAccountReady = useCallback(() => {
    if (!uid || !user) {
      throw new Error("You are not logged in.");
    }

    if (!isActiveCustomer || !canShop) {
      throw new Error("Only active customers can use the shopping cart.");
    }

    if (!sessionMatches(uid)) {
      throw new Error("Authentication session changed.");
    }

    if (!isAccountReady) {
      throw new Error(
        syncState.error || "Please complete cart synchronization first.",
      );
    }
  }, [
    uid,
    user,
    isActiveCustomer,
    canShop,
    isAccountReady,
    syncState.error,
    sessionMatches,
  ]);

  // ==========================================
  // ADD TO CART
  // ==========================================

  const addToCart = useCallback(
    async (productData) => {
      if (authLoading) {
        throw new Error("Please wait for authentication.");
      }

      const newItem = prepareCartItem(productData);

      if (!uid) {
        return updateGuestCart((current) => {
          const existing = current.find((item) =>
            isSameConfiguration(item, newItem),
          );

          if (existing) {
            const quantity = Number(existing.quantity) + newItem.quantity;

            if (quantity > MAX_QUANTITY) {
              throw new Error(
                `Maximum ${MAX_QUANTITY} units allowed for the same configuration.`,
              );
            }

            return current.map((item) =>
              item.cartId === existing.cartId
                ? {
                    ...item,
                    quantity,
                  }
                : item,
            );
          }

          if (current.length >= MAX_ITEMS) {
            throw new Error("Cart item limit exceeded.");
          }

          return [...current, newItem];
        });
      }

      ensureAccountReady();

      const targetUid = uid;
      const firebaseUser = user;
      const requestId = generateId();

      return enqueueMutation(async () => {
        if (!sessionMatches(targetUid)) {
          throw new Error("Authentication session changed.");
        }

        try {
          const result = await cartRequest(firebaseUser, "/cart/items", {
            method: "POST",
            body: {
              requestId,
              item: newItem,
            },
          });

          applyAccountCart(targetUid, result);

          notifyAccountUpdated(targetUid);

          return result.cart;
        } catch (error) {
          setMutationError(error.message);
          throw error;
        }
      });
    },
    [
      authLoading,
      uid,
      user,
      ensureAccountReady,
      updateGuestCart,
      enqueueMutation,
      applyAccountCart,
      sessionMatches,
    ],
  );

  // ==========================================
  // UPDATE QUANTITY
  // ==========================================

  const updateQuantity = useCallback(
    async (cartId, quantity) => {
      if (authLoading) {
        throw new Error("Authentication is still loading.");
      }

      const nextQuantity = Number(quantity);

      if (
        !Number.isInteger(nextQuantity) ||
        nextQuantity < 1 ||
        nextQuantity > MAX_QUANTITY
      ) {
        throw new Error(`Quantity must be between 1 and ${MAX_QUANTITY}.`);
      }

      if (!uid) {
        return updateGuestCart((current) => {
          const found = current.some((item) => item.cartId === cartId);

          if (!found) {
            throw new Error("Cart item not found.");
          }

          return current.map((item) =>
            item.cartId === cartId
              ? {
                  ...item,
                  quantity: nextQuantity,
                }
              : item,
          );
        });
      }

      ensureAccountReady();

      const targetUid = uid;
      const firebaseUser = user;

      return enqueueMutation(async () => {
        if (!sessionMatches(targetUid)) {
          throw new Error("Authentication session changed.");
        }

        try {
          const result = await cartRequest(
            firebaseUser,
            `/cart/items/${encodeURIComponent(cartId)}`,
            {
              method: "PATCH",
              body: {
                quantity: nextQuantity,
              },
            },
          );

          applyAccountCart(targetUid, result);

          notifyAccountUpdated(targetUid);

          return result.cart;
        } catch (error) {
          setMutationError(error.message);
          throw error;
        }
      });
    },
    [
      authLoading,
      uid,
      user,
      ensureAccountReady,
      updateGuestCart,
      enqueueMutation,
      applyAccountCart,
      sessionMatches,
    ],
  );

  // ==========================================
  // UPDATE CART ITEM CONFIGURATION
  // Works for both Guest and Logged-in users
  // ==========================================

  const updateCartItem = useCallback(
    async (cartId, updatedData) => {
      if (authLoading) {
        throw new Error("Authentication is still loading.");
      }

      if (!cartId) {
        throw new Error("Cart item ID is required.");
      }

      const updatedItem = prepareCartItem({
        ...updatedData,
        cartId,
      });

      // ======================================
      // GUEST CART -> LOCAL STORAGE
      // ======================================

      if (!uid) {
        return updateGuestCart((current) => {
          const index = current.findIndex((item) => item.cartId === cartId);

          if (index === -1) {
            throw new Error("Cart item not found.");
          }

          const previous = current[index];

          if (previous.productId !== updatedItem.productId) {
            throw new Error(
              "Cannot change the product of an existing cart item.",
            );
          }

          const duplicate = current.some(
            (item, itemIndex) =>
              itemIndex !== index && isSameConfiguration(item, updatedItem),
          );

          if (duplicate) {
            throw new Error("This configuration already exists in your cart.");
          }

          const next = [...current];

          next[index] = {
            ...updatedItem,
            cartId: previous.cartId,
            addedAt: previous.addedAt,
            updatedAt: new Date().toISOString(),
          };

          return next;
        });
      }

      // ======================================
      // LOGGED-IN CART -> MONGODB
      // ======================================

      ensureAccountReady();

      const targetUid = uid;
      const firebaseUser = user;

      return enqueueMutation(async () => {
        if (!sessionMatches(targetUid)) {
          throw new Error("Authentication session changed.");
        }

        try {
          const result = await cartRequest(
            firebaseUser,
            `/cart/items/${encodeURIComponent(cartId)}/configuration`,
            {
              method: "PATCH",
              body: {
                item: updatedItem,
              },
            },
          );

          applyAccountCart(targetUid, result);

          notifyAccountUpdated(targetUid);

          return result.cart;
        } catch (error) {
          setMutationError(error.message);
          throw error;
        }
      });
    },
    [
      authLoading,
      uid,
      user,
      updateGuestCart,
      ensureAccountReady,
      enqueueMutation,
      applyAccountCart,
      sessionMatches,
    ],
  );

  // ==========================================
  // REMOVE ITEM
  // ==========================================

  const removeFromCart = useCallback(
    async (cartId) => {
      if (authLoading) {
        throw new Error("Authentication is still loading.");
      }

      if (!uid) {
        return updateGuestCart((current) => {
          const found = current.some((item) => item.cartId === cartId);

          if (!found) {
            throw new Error("Cart item not found.");
          }

          return current.filter((item) => item.cartId !== cartId);
        });
      }

      ensureAccountReady();

      const targetUid = uid;
      const firebaseUser = user;

      return enqueueMutation(async () => {
        if (!sessionMatches(targetUid)) {
          throw new Error("Authentication session changed.");
        }

        try {
          const result = await cartRequest(
            firebaseUser,
            `/cart/items/${encodeURIComponent(cartId)}`,
            {
              method: "DELETE",
            },
          );

          applyAccountCart(targetUid, result);

          notifyAccountUpdated(targetUid);

          return result.cart;
        } catch (error) {
          setMutationError(error.message);
          throw error;
        }
      });
    },
    [
      authLoading,
      uid,
      user,
      ensureAccountReady,
      updateGuestCart,
      enqueueMutation,
      applyAccountCart,
      sessionMatches,
    ],
  );

  // ==========================================
  // CLEAR CART
  // ==========================================

  const clearCart = useCallback(async () => {
    if (authLoading) {
      throw new Error("Authentication is still loading.");
    }

    if (!uid) {
      return updateGuestCart(() => []);
    }

    ensureAccountReady();

    const targetUid = uid;
    const firebaseUser = user;

    return enqueueMutation(async () => {
      if (!sessionMatches(targetUid)) {
        throw new Error("Authentication session changed.");
      }

      try {
        await cartRequest(firebaseUser, "/cart", {
          method: "DELETE",
        });

        applyAccountCart(targetUid, {
          items: [],
          version: 0,
        });

        notifyAccountUpdated(targetUid);

        return [];
      } catch (error) {
        setMutationError(error.message);
        throw error;
      }
    });
  }, [
    authLoading,
    uid,
    user,
    ensureAccountReady,
    updateGuestCart,
    enqueueMutation,
    applyAccountCart,
    sessionMatches,
  ]);

  // ==========================================
  // REFRESH LOGGED-IN CART
  // ==========================================

  const refreshCart = useCallback(async () => {
    if (!canShop) {
      throw new Error("Shopping cart access is not allowed.");
    }
    if (!uid || !user) {
      const localItems = readGuestCart();
      setGuestItems(localItems);
      return localItems;
    }

    ensureAccountReady();

    const targetUid = uid;
    const firebaseUser = user;

    return enqueueMutation(async () => {
      if (!sessionMatches(targetUid)) {
        return [];
      }

      const result = await cartRequest(firebaseUser, "/cart");

      applyAccountCart(targetUid, result);

      return result.items;
    });
  }, [
    canShop,
    uid,
    user,
    ensureAccountReady,
    enqueueMutation,
    applyAccountCart,
    sessionMatches,
  ]);

  // ==========================================
  // RETRY FAILED LOGIN/REGISTER SYNC
  // ==========================================

  const retrySync = useCallback(() => {
    setMutationError("");

    setRetryNumber((current) => current + 1);
  }, []);

  // ==========================================
  // CROSS-TAB SYNCHRONIZATION
  // ==========================================

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === GUEST_CART_KEY && !uid) {
        setGuestItems(readGuestCart());
      }

      if (event.key === ACCOUNT_SYNC_KEY && uid && isAccountReady) {
        try {
          const data = JSON.parse(event.newValue || "{}");

          if (data.uid === uid) {
            refreshCart().catch((error) => {
              console.error("Cross-tab Cart Refresh:", error);
            });
          }
        } catch (error) {
          console.error("Invalid cart sync event:", error);
        }
      }
    };

    const handleGuestCartEvent = () => {
      if (!uid) {
        setGuestItems(readGuestCart());
      }
    };

    window.addEventListener("storage", handleStorage);

    window.addEventListener("sokhbilash-cart-updated", handleGuestCartEvent);

    return () => {
      window.removeEventListener("storage", handleStorage);

      window.removeEventListener(
        "sokhbilash-cart-updated",
        handleGuestCartEvent,
      );
    };
  }, [uid, isAccountReady, refreshCart]);

  // ==========================================
  // CART CALCULATIONS
  // ==========================================

  const totalQuantity = useMemo(
    () => items.reduce((total, item) => total + Number(item.quantity || 0), 0),
    [items],
  );

  const subtotal = useMemo(
    () =>
      items
        .filter((item) => !item.unavailable)
        .reduce(
          (total, item) => total + getPrice(item) * Number(item.quantity || 0),
          0,
        ),
    [items],
  );

  const cartCount = totalQuantity;

  const isInCart = useCallback(
    (configuration) => {
      return items.some((item) => isSameConfiguration(item, configuration));
    },
    [items],
  );

  // ==========================================
  // CONTEXT DATA
  // ==========================================

  const cartData = useMemo(
    () => ({
      items,
      cartItems: items,

      cartCount,
      totalQuantity,
      subtotal,

      isAuthenticated,
      isGuest: !isAuthenticated,
      canShop,
      cartLoading,
      cartReady,
      cartError,

      addToCart,
      updateCartItem,
      updateQuantity,
      removeFromCart,
      clearCart,
      refreshCart,
      retrySync,

      isInCart,

      maxQuantity: MAX_QUANTITY,
    }),
    [
      canShop,
      items,
      cartCount,
      totalQuantity,
      subtotal,
      isAuthenticated,
      cartLoading,
      cartReady,
      cartError,
      addToCart,
      updateCartItem,
      updateQuantity,
      removeFromCart,
      clearCart,
      refreshCart,
      retrySync,
      isInCart,
    ],
  );

  return (
    <CartContext.Provider value={cartData}>{children}</CartContext.Provider>
  );
};

export default CartProvider;
