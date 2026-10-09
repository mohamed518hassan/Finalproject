"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  ShoppingCart,
  Zap,
  Minus,
  Plus,
  LoaderCircle,
} from "lucide-react";
import { useCart } from "@/context/CartContext";

// 1. تعريف واجهة بيانات المنتج لمنع خطأ Unexpected any
interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  priceAfterDiscount?: number;
  quantity: number;
  ratingsAverage: number;
  ratingsQuantity: number;
  imageCover: string;
  images: string[];
  category?: { name: string };
  brand?: { name: string };
}
export default function ProductsDetail({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const resolvedParams = params instanceof Promise ? React.use(params) : params;
  const id = resolvedParams?.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [cartMessage, setCartMessage] = useState<string>("");
  const [cartError, setCartError] = useState<string>("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const {
    addToCart,
    cartItems,
    isLoading: isCartLoading,
    updateQuantity,
    checkout,
  } = useCart();

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const res = await fetch(
          `https://ecommerce.routemisr.com/api/v1/products/${id}`,
        );
        if (!res.ok) throw new Error("Product request failed");
        const data = await res.json();
        if (!data?.data) throw new Error("Product was not found");
        setProduct(data.data);
      } catch {
        setProduct(null);
        setCartError(
          "We couldn't load this product. Check your connection and try again.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchProduct();
    }
  }, [id, loadAttempt]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-medium text-gray-500">
          جاري تحميل البيانات...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-medium text-gray-600" role="alert">
          {cartError || "This product could not be found."}
        </p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setCartError("");
            setLoadAttempt((attempt) => attempt + 1);
          }}
          className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Try again
        </button>
      </div>
    );
  }

  const images = product?.images?.length
    ? product.images
    : [product?.imageCover];
  const currentPrice = product.priceAfterDiscount ?? product.price;
  const totalPrice = currentPrice * quantity;
  const isAvailable = product.quantity > 0;

  const handleQuantity = (type: "inc" | "dec") => {
    if (type === "dec" && quantity > 1) setQuantity((prev) => prev - 1);
    if (type === "inc" && quantity < product.quantity)
      setQuantity((prev) => prev + 1);
  };

  const handleAddToCart = async (buyNow = false) => {
    if (isAddingToCart || isCartLoading || !isAvailable) return;
    setIsAddingToCart(true);
    setCartMessage("");
    setCartError("");
    try {
      const existingItem = cartItems.find((item) => item.id === product._id);

      if (existingItem) {
        const quantityResult = await updateQuantity(
          product._id,
          existingItem.quantity + quantity,
        );
        if (!quantityResult.ok) {
          setCartError(
            quantityResult.error ?? "Unable to update the cart quantity.",
          );
          return;
        }
      } else {
        const result = await addToCart(product._id, {
          id: product._id,
          title: product.title,
          price: currentPrice,
          image: product.imageCover,
          category: product.category?.name,
        });

        if (!result.ok) {
          setCartError(
            result.error ?? "Unable to add this product to your cart.",
          );
          return;
        }

        if (quantity > 1) {
          const quantityResult = await updateQuantity(product._id, quantity);
          if (!quantityResult.ok) {
            setCartError(
              quantityResult.error ?? "Unable to update the cart quantity.",
            );
            return;
          }
        }
      }

      setCartMessage("Product added to your cart.");
      if (buyNow) checkout();
    } catch {
      setCartError("We couldn't update your cart. Please try again.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className=" mx-auto md:p-5 bg-white text-gray-800">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-3 flex flex-col gap-4  rounded-lg w-75">
          <div className="w-full aspect-4/5 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            <img
              src={images[selectedImage]}
              alt={product?.title}
              className="w-full h-full object-cover object-center"
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            {images.map((img: string, index: number) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
                  selectedImage === index
                    ? "border-emerald-500 ring-1 ring-emerald-500"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <img
                  src={img}
                  alt={`Thumb ${index}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-9 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {product?.category?.name && (
                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
                  {product.category.name}
                </span>
              )}
              {product?.brand?.name && (
                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
                  {product.brand.name}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              {product?.title}
            </h1>

            <div className="flex items-center gap-2">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    fill={
                      i < Math.floor(product?.ratingsAverage || 0)
                        ? "currentColor"
                        : "none"
                    }
                    className={
                      i < Math.floor(product?.ratingsAverage || 0)
                        ? ""
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500 font-medium">
                {product?.ratingsAverage} ({product?.ratingsQuantity || 0}{" "}
                reviews)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-900">
                {currentPrice} EGP
              </span>
              {product?.priceAfterDiscount && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    {product?.price} EGP
                  </span>
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                    Save{" "}
                    {Math.round(
                      ((product.price - product.priceAfterDiscount) /
                        product.price) *
                        100,
                    )}
                    %
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
              <span
                className={`h-2 w-2 rounded-full ${isAvailable ? "bg-emerald-500" : "bg-red-500"}`}
                aria-hidden="true"
              ></span>
              {isAvailable ? `${product.quantity} available` : "Out of stock"}
            </div>

            <p className="text-sm text-gray-600 leading-relaxed pt-2">
              {product?.description}
            </p>

            <div className="pt-4 space-y-2">
              <span className="text-xs text-gray-500 font-medium block">
                Quantity
              </span>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    type="button"
                    onClick={() => handleQuantity("dec")}
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                    className="p-2 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="px-4 py-1 text-sm font-semibold min-w-10 text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantity("inc")}
                    aria-label="Increase quantity"
                    disabled={quantity >= product.quantity}
                    className="p-2 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <span className="text-xs text-gray-400" aria-live="polite">
                  {quantity} selected
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 font-medium">
                Total Price:
              </span>
              <span className="text-xl font-bold text-emerald-600">
                {totalPrice.toFixed(2)} EGP
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => void handleAddToCart()}
                disabled={isAddingToCart || isCartLoading || !isAvailable}
                className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                aria-busy={isAddingToCart}
              >
                {isAddingToCart ? (
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <ShoppingCart size={18} aria-hidden="true" />
                )}
                {isAddingToCart
                  ? "Adding..."
                  : isAvailable
                    ? "Add to Cart"
                    : "Out of Stock"}
              </button>
              <button
                type="button"
                onClick={() => void handleAddToCart(true)}
                disabled={isAddingToCart || isCartLoading || !isAvailable}
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                aria-busy={isAddingToCart}
              >
                <Zap size={18} aria-hidden="true" />
                Buy Now
              </button>
            </div>
            {cartError && (
              <p className="text-sm font-medium text-red-600" role="alert">
                {cartError}
              </p>
            )}
            {cartMessage && (
              <p className="text-sm font-medium text-emerald-600" role="status">
                {cartMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
