"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  addProductToCart,
  clearUserCart,
  getCart,
  removeCartItem,
  updateCartItem,
  type CartApiProduct,
} from "@/api/cart";

const GUEST_CART_KEY = "guestCart";
const GUEST_CART_SYNC_KEY = "guestCartSyncTargets";

type GuestCartSyncTargets = Record<string, { serverQuantity: number }>;

function readGuestCartSyncTargets(): GuestCartSyncTargets {
  try {
    const stored = localStorage.getItem(GUEST_CART_SYNC_KEY);
    if (!stored) return {};
    const parsed: unknown = JSON.parse(stored);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {};
    }
    const targets: GuestCartSyncTargets = {};
    for (const [productId, value] of Object.entries(parsed)) {
      if (
        typeof value === "object" &&
        value !== null &&
        "serverQuantity" in value &&
        typeof value.serverQuantity === "number" &&
        Number.isInteger(value.serverQuantity) &&
        value.serverQuantity >= 0
      ) {
        targets[productId] = { serverQuantity: value.serverQuantity };
      }
    }
    return targets;
  } catch {
    return {};
  }
}

export interface CartProductSnapshot {
  id: string;
  title: string;
  price: number;
  image: string;
  category?: string;
}

export interface CartItem extends CartProductSnapshot {
  quantity: number;
}

export interface CartOperationResult {
  ok: boolean;
  error?: string;
  status?: number;
}

interface CartContextValue {
  cartCount: number;
  cartId: string | null;
  cartItems: CartItem[];
  totalPrice: number;
  items: CartItem[];
  isLoading: boolean;
  pendingQuantityIds: string[];
  pendingRemovalIds: string[];
  error: string | null;
  addToCart: (
    productId: string,
    product?: CartProductSnapshot,
  ) => Promise<CartOperationResult>;
  updateQuantity: (
    productId: string,
    quantity: number,
  ) => Promise<CartOperationResult>;
  removeFromCart: (productId: string) => Promise<CartOperationResult>;
  syncGuestCart: () => Promise<CartOperationResult>;
  clearCart: () => Promise<CartOperationResult>;
  reloadCart: () => Promise<void>;
  checkout: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingQuantityIds, setPendingQuantityIds] = useState<string[]>([]);
  const [pendingRemovalIds, setPendingRemovalIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pendingCartOperations = useRef(new Set<string>());
  const pendingAddOperations = useRef(new Set<string>());
  const router = useRouter();
  const { status: authStatus } = useAuth();

  const isAuthenticated = useCallback(
    () => authStatus === "authenticated",
    [authStatus],
  );

  const saveGuestCart = useCallback((nextItems: CartItem[]) => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(nextItems));
    setItems(nextItems);
  }, []);

  const parseGuestCart = useCallback((): CartItem[] => {
    try {
      const stored = localStorage.getItem(GUEST_CART_KEY);
      if (!stored) return [];
      const parsed: unknown = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (item): item is CartItem =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as CartItem).id === "string" &&
          typeof (item as CartItem).quantity === "number",
      );
    } catch {
      return [];
    }
  }, []);

  const removeGuestCartItem = useCallback(
    (productId: string) => {
      const remainingItems = parseGuestCart().filter(
        (item) => item.id !== productId,
      );
      if (remainingItems.length === 0) {
        localStorage.removeItem(GUEST_CART_KEY);
        return;
      }
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(remainingItems));
    },
    [parseGuestCart],
  );

  const removeGuestCartSyncTarget = useCallback((productId: string) => {
    const syncTargets = readGuestCartSyncTargets();
    delete syncTargets[productId];
    if (Object.keys(syncTargets).length === 0) {
      localStorage.removeItem(GUEST_CART_SYNC_KEY);
      return;
    }
    localStorage.setItem(GUEST_CART_SYNC_KEY, JSON.stringify(syncTargets));
  }, []);

  const mapApiItem = (item: CartApiProduct): CartItem | null => {
    const product = item.product;
    if (!product?._id || !product.title) return null;
    return {
      id: product._id,
      title: product.title,
      price: item.price ?? product.price ?? 0,
      image: product.imageCover ?? "",
      category: product.category?.name,
      quantity: item.count ?? 1,
    };
  };

  const loadCart = useCallback(async () => {
    setError(null);

    if (authStatus === "loading") {
      setIsLoading(true);
      return;
    }

    if (!isAuthenticated()) {
      setCartId(null);
      setItems(parseGuestCart());
      setIsLoading(false);
      return;
    }

    const result = await getCart();
    if (result.ok) {
      setCartId(result.cartId ?? result.data?.cartId ?? result.data?._id ?? null);
      setItems(
        (result.data?.products ?? [])
          .map(mapApiItem)
          .filter((item): item is CartItem => item !== null),
      );
    } else {
      setCartId(null);
      setError(result.error ?? "Unable to load your cart");
    }
    setIsLoading(false);
  }, [authStatus, isAuthenticated, parseGuestCart]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCart(), 0);
    return () => window.clearTimeout(timer);
  }, [loadCart]);

  useEffect(() => {
    const onStorage = () => void loadCart();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [loadCart]);

  const handleApiFailure = useCallback(
    (message: string, status?: number): CartOperationResult => {
      setError(message);
      return {
        ok: false,
        error: message,
        ...(status !== undefined ? { status } : {}),
      };
    },
    [],
  );

  const addToCart = useCallback(
    async (
      productId: string,
      product?: CartProductSnapshot,
    ): Promise<CartOperationResult> => {
      if (pendingAddOperations.current.has(productId)) {
        return { ok: false, error: "This item is already being added." };
      }
      pendingAddOperations.current.add(productId);
      setError(null);
      try {
        if (!isAuthenticated()) {
          if (!product)
            return handleApiFailure(
              "Product details are required for a guest cart",
            );
          const current = parseGuestCart();
          const existing = current.find((item) => item.id === productId);
          saveGuestCart(
            existing
              ? current.map((item) =>
                  item.id === productId
                    ? { ...item, quantity: item.quantity + 1 }
                    : item,
                )
              : [...current, { ...product, quantity: 1 }],
          );
          return { ok: true };
        }

        const result = await addProductToCart(productId);
        if (!result.ok) {
          return handleApiFailure(
            result.error ?? "Unable to add item to cart",
            result.status,
          );
        }
        if (result.cartId ?? result.data?.cartId ?? result.data?._id) {
          setCartId(
            result.cartId ?? result.data?.cartId ?? result.data?._id ?? null,
          );
        }
        if (result.data?.products) {
          setItems(
            result.data.products
              .map(mapApiItem)
              .filter((item): item is CartItem => item !== null),
          );
        } else if (product) {
          setItems((current) => {
            const existing = current.find((item) => item.id === productId);
            return existing
              ? current.map((item) =>
                  item.id === productId
                    ? { ...item, quantity: item.quantity + 1 }
                    : item,
                )
              : [...current, { ...product, quantity: 1 }];
          });
        } else {
          const cartResult = await getCart();
          if (cartResult.ok) {
            setCartId(
              cartResult.cartId ??
                cartResult.data?.cartId ??
                cartResult.data?._id ??
                null,
            );
            setItems(
              (cartResult.data?.products ?? [])
                .map(mapApiItem)
                .filter((item): item is CartItem => item !== null),
            );
          }
        }
        return { ok: true };
      } finally {
        pendingAddOperations.current.delete(productId);
      }
    },
    [handleApiFailure, isAuthenticated, parseGuestCart, saveGuestCart],
  );

  const removeFromCart = useCallback(
    async (productId: string): Promise<CartOperationResult> => {
      if (pendingCartOperations.current.has(productId)) return { ok: false };
      pendingCartOperations.current.add(productId);
      setError(null);
      setPendingRemovalIds((current) =>
        current.includes(productId) ? current : [...current, productId],
      );

      try {
        if (!isAuthenticated()) {
          removeGuestCartSyncTarget(productId);
          saveGuestCart(
            parseGuestCart().filter((item) => item.id !== productId),
          );
          return { ok: true };
        }

        const result = await removeCartItem(productId);
        if (!result.ok) {
          return handleApiFailure(
            result.error ?? "Unable to remove cart item",
            result.status,
          );
        }
        setItems((current) => current.filter((item) => item.id !== productId));
        return { ok: true };
      } finally {
        pendingCartOperations.current.delete(productId);
        setPendingRemovalIds((current) =>
          current.filter((id) => id !== productId),
        );
      }
    },
    [
      handleApiFailure,
      parseGuestCart,
      removeGuestCartSyncTarget,
      saveGuestCart,
      isAuthenticated,
    ],
  );

  const updateQuantity = useCallback(
    async (
      productId: string,
      quantity: number,
    ): Promise<CartOperationResult> => {
      if (!Number.isInteger(quantity) || quantity < 1) {
        return handleApiFailure("Quantity must be at least 1.");
      }
      if (pendingCartOperations.current.has(productId)) return { ok: false };
      pendingCartOperations.current.add(productId);
      setError(null);
      setPendingQuantityIds((current) =>
        current.includes(productId) ? current : [...current, productId],
      );

      try {
        if (!isAuthenticated()) {
          saveGuestCart(
            parseGuestCart().map((item) =>
              item.id === productId ? { ...item, quantity } : item,
            ),
          );
          return { ok: true };
        }

        const result = await updateCartItem(productId, quantity);
        if (!result.ok) {
          return handleApiFailure(
            result.error ?? "Unable to update cart item",
            result.status,
          );
        }
        setItems((current) =>
          current.map((item) =>
            item.id === productId ? { ...item, quantity } : item,
          ),
        );
        return { ok: true };
      } finally {
        pendingCartOperations.current.delete(productId);
        setPendingQuantityIds((current) =>
          current.filter((id) => id !== productId),
        );
      }
    },
    [handleApiFailure, isAuthenticated, parseGuestCart, saveGuestCart],
  );

  const syncGuestCart = useCallback(async (): Promise<CartOperationResult> => {
    const guestItems = parseGuestCart();
    const serverCartResult = await getCart();
    if (!serverCartResult.ok) {
      return handleApiFailure(
        serverCartResult.error ?? "Unable to load your cart",
        serverCartResult.status,
      );
    }

    const serverItems = serverCartResult.data?.products ?? [];
    const syncTargets = readGuestCartSyncTargets();

    for (const item of guestItems) {
      const serverItem = serverItems.find(
        (cartItem) => cartItem.product?._id === item.id,
      );
      let syncTarget = syncTargets[item.id];

      if (!syncTarget) {
        syncTarget = {
          serverQuantity: serverItem ? (serverItem.count ?? 1) : 0,
        };
        syncTargets[item.id] = syncTarget;
        localStorage.setItem(GUEST_CART_SYNC_KEY, JSON.stringify(syncTargets));
      }

      const targetQuantity = syncTarget.serverQuantity + item.quantity;

      if (!serverItem) {
        const addResult = await addProductToCart(item.id);
        if (!addResult.ok) {
          return handleApiFailure(
            addResult.error ?? "Unable to sync guest cart",
            addResult.status,
          );
        }
      }

      const currentQuantity = serverItem?.count ?? (serverItem ? 1 : 0);
      if (targetQuantity > 1 && currentQuantity !== targetQuantity) {
        const updateResult = await updateCartItem(item.id, targetQuantity);
        if (!updateResult.ok) {
          return handleApiFailure(
            updateResult.error ?? "Unable to sync guest cart",
            updateResult.status,
          );
        }
      }

      removeGuestCartItem(item.id);
      delete syncTargets[item.id];
      if (Object.keys(syncTargets).length === 0) {
        localStorage.removeItem(GUEST_CART_SYNC_KEY);
      } else {
        localStorage.setItem(GUEST_CART_SYNC_KEY, JSON.stringify(syncTargets));
      }
    }

    const refreshedCart = await getCart();
    if (!refreshedCart.ok) {
      return handleApiFailure(
        refreshedCart.error ?? "Unable to refresh your cart",
        refreshedCart.status,
      );
    }
    setCartId(
      refreshedCart.cartId ??
        refreshedCart.data?.cartId ??
        refreshedCart.data?._id ??
        null,
    );
    setItems(
      (refreshedCart.data?.products ?? [])
        .map(mapApiItem)
        .filter((item): item is CartItem => item !== null),
    );
    return { ok: true };
  }, [handleApiFailure, parseGuestCart, removeGuestCartItem]);

  const clearCart = useCallback(async (): Promise<CartOperationResult> => {
    const result = await clearUserCart();
    localStorage.removeItem(GUEST_CART_KEY);
    localStorage.removeItem(GUEST_CART_SYNC_KEY);
    setCartId(null);
    setItems([]);
    setError(
      result.ok ? null : (result.error ?? "Unable to clear your cart."),
    );
    return result.ok
      ? { ok: true }
      : {
          ok: false,
          error: result.error ?? "Unable to clear your cart.",
          status: result.status,
        };
  }, []);

  const checkout = useCallback(() => {
    if (isAuthenticated()) {
      router.push("/checkout");
      return;
    }
    sessionStorage.setItem(
      "loginMessage",
      "Please log in to complete your purchase.",
    );
    router.push(`/login?redirect=${encodeURIComponent("/checkout")}`);
  }, [isAuthenticated, router]);

  const cartCount = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        cartCount,
        cartId,
        cartItems: items,
        totalPrice,
        items,
        isLoading,
        pendingQuantityIds,
        pendingRemovalIds,
        error,
        addToCart,
        updateQuantity,
        removeFromCart,
        syncGuestCart,
        clearCart,
        reloadCart: loadCart,
        checkout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
