import type { Product } from "@/types/product";

interface ProductsResponse {
  data: Product[];
}

export async function getAllProducts(): Promise<Product[]> {
  const res = await fetch("https://ecommerce.routemisr.com/api/v1/products", {
    next: { revalidate: 60 }
  });
  if (!res.ok) throw new Error("Failed to fetch products");
  const data: ProductsResponse = await res.json();
  return data.data;
}