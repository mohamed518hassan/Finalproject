"use client";

import { toast } from "react-toastify";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  addProductToWishlist,
  getWishlist,
  removeProductFromWishlist,
} from "@/api/wishlist";
import type { Product } from "@/types/product";
import { useAuth } from "@/context/AuthContext";

const WISHLIST_STORAGE_KEY = "wishlistProducts";

export interface WishlistOperationResult {
  ok: boolean;
  error?: string;
}

interface WishlistContextValue {
  items: Product[];
  isLoading: boolean;
  error: string | null;
  message: string | null;
  pendingProductIds: string[];
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (product: Product) => Promise<WishlistOperationResult>;
  removeFromWishlist: (productId: string) => Promise<WishlistOperationResult>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(
  undefined,
);

function isWishlistProduct(value: unknown): value is Product {
  if (typeof value !== "object" || value === null) return false;
  const product = value as Partial<Product>;
  return (
    typeof product._id === "string" &&
    typeof product.title === "string" &&
    typeof product.price === "number" &&
    typeof product.imageCover === "string" &&
    typeof product.ratingsAverage === "number"
  );
}

function saveWishlistCache(items: Product[]) {
  localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingProductIds, setPendingProductIds] = useState<string[]>([]);
  const itemsRef = useRef<Product[]>([]);
  const pendingRequests = useRef(new Map<string, symbol>());
  const authGeneration = useRef(0);
  const syncRevision = useRef(0);
  const { status: authStatus } = useAuth();

  const updateItems = (nextItems: Product[]) => {
    itemsRef.current = nextItems;
    setItems(nextItems);
    saveWishlistCache(nextItems);
  };

  const clearWishlist = useCallback(() => {
    itemsRef.current = [];
    setItems([]);
    setError(null);
    setMessage(null);
    setPendingProductIds([]);
    setIsLoading(false);
    try {
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
    } catch {
      setError("Unable to clear the local wishlist cache");
    }
  }, []);

  const loadWishlist = useCallback(async () => {
    const generation = authGeneration.current;
    const revision = ++syncRevision.current;
    setError(null);
    setMessage(null);

    if (authStatus === "loading") {
      setIsLoading(true);
      return;
    }

    if (authStatus !== "authenticated") {
      clearWishlist();
      return;
    }

    itemsRef.current = [];
    setItems([]);
    try {
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
    } catch {
      setError("Unable to clear the previous local wishlist cache");
    }
    setIsLoading(true);

    const result = await getWishlist();
    if (
      generation !== authGeneration.current ||
      revision !== syncRevision.current
    ) {
      return;
    }

    if (!result.ok) {
      setError(result.error ?? "Unable to load your wishlist");
      setIsLoading(false);
      return;
    }

    if (!Array.isArray(result.data)) {
      setError("Invalid wishlist response");
      setIsLoading(false);
      return;
    }

    const products = result.data.filter(isWishlistProduct);
    itemsRef.current = products;
    setItems(products);
    try {
      saveWishlistCache(products);
    } catch {
      setError("Wishlist loaded, but it could not be saved locally");
    }
    setIsLoading(false);
  }, [authStatus, clearWishlist]);

  useEffect(() => {
    authGeneration.current += 1;
    syncRevision.current += 1;
    pendingRequests.current.clear();
    const timer = window.setTimeout(() => void loadWishlist(), 0);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === WISHLIST_STORAGE_KEY) {
        void loadWishlist();
      }
    };

    const onStorage = (event: StorageEvent) => {
      handleStorage(event);
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.clearTimeout(timer);
      authGeneration.current += 1;
      window.removeEventListener("storage", onStorage);
    };
  }, [loadWishlist]);

  const setProductPending = (productId: string, pending: boolean) => {
    setPendingProductIds((current) =>
      pending
        ? current.includes(productId)
          ? current
          : [...current, productId]
        : current.filter((id) => id !== productId),
    );
  };

  const addToWishlist = async (
    product: Product,
  ): Promise<WishlistOperationResult> => {
    if (pendingRequests.current.has(product._id)) {
      return { ok: false, error: "Wishlist request is already in progress" };
    }
    const requestId = Symbol(product._id);
    const generation = authGeneration.current;
    pendingRequests.current.set(product._id, requestId);
    setProductPending(product._id, true);
    setError(null);
    setMessage(null);

    try {
      const result = await addProductToWishlist(product._id);
      if (generation !== authGeneration.current) {
        return {
          ok: false,
          error: "Authentication changed during wishlist request",
        };
      }
      if (!result.ok) {
        setError(result.error ?? "Unable to add product to wishlist");
        return result;
      }

      syncRevision.current += 1;
      const nextItems = itemsRef.current.some(
        (item) => item._id === product._id,
      )
        ? itemsRef.current
        : [...itemsRef.current, product];
      try {
        updateItems(nextItems);
      } catch {
        setError(
          "Added to your account, but the local wishlist could not be saved",
        );
        return { ok: false, error: "Unable to save the local wishlist" };
      }
      setMessage("Added to wishlist.");

      // ✨ إشعار النجاح لإضافة المفضلة
      toast.success("تمت إضافة المنتج إلى المفضلة بنجاح! ❤️");

      return { ok: true };
    } catch (requestError) {
      const errorMessage =
        requestError instanceof Error
          ? requestError.message
          : "Unable to add product to wishlist";
      setError(errorMessage);
      return { ok: false, error: errorMessage };
    } finally {
      if (pendingRequests.current.get(product._id) === requestId) {
        pendingRequests.current.delete(product._id);
        setProductPending(product._id, false);
      }
    }
  };

  const removeFromWishlist = async (
    productId: string,
  ): Promise<WishlistOperationResult> => {
    if (pendingRequests.current.has(productId)) {
      return { ok: false, error: "Wishlist request is already in progress" };
    }
    const requestId = Symbol(productId);
    const generation = authGeneration.current;
    pendingRequests.current.set(productId, requestId);
    setProductPending(productId, true);
    setError(null);
    setMessage(null);

    try {
      const result = await removeProductFromWishlist(productId);
      if (generation !== authGeneration.current) {
        return {
          ok: false,
          error: "Authentication changed during wishlist request",
        };
      }
      if (!result.ok) {
        setError(result.error ?? "Unable to remove product from wishlist");
        return result;
      }

      syncRevision.current += 1;
      const nextItems = itemsRef.current.filter(
        (item) => item._id !== productId,
      );
      try {
        updateItems(nextItems);
      } catch {
        setError(
          "Removed from your account, but the local wishlist could not be updated",
        );
        return { ok: false, error: "Unable to update the local wishlist" };
      }
      setMessage("Removed from wishlist.");

      // ✨ إشعار الحذف من المفضلة
      toast.info("تم إزالة المنتج من المفضلة 🗑️");

      return { ok: true };
    } catch (requestError) {
      const errorMessage =
        requestError instanceof Error
          ? requestError.message
          : "Unable to remove product from wishlist";
      setError(errorMessage);
      return { ok: false, error: errorMessage };
    } finally {
      if (pendingRequests.current.get(productId) === requestId) {
        pendingRequests.current.delete(productId);
        setProductPending(productId, false);
      }
    }
  };

  const isInWishlist = (productId: string) =>
    items.some((item) => item._id === productId);

  return (
    <WishlistContext.Provider
      value={{
        items,
        isLoading,
        error,
        message,
        pendingProductIds,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
