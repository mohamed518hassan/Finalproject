import type { Product } from "@/types/product";

interface ProductsResponse {
  data: Product[];
}

interface PaginatedProductsResponse extends ProductsResponse {
  metadata: {
    currentPage: number;
    numberOfPages: number;
    limit: number;
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const res = await fetch("https://ecommerce.routemisr.com/api/v1/products", {
    next: { revalidate: 60 }
  });
  if (!res.ok) throw new Error("Failed to fetch products");
  const data: ProductsResponse = await res.json();
  return data.data;
}

export async function getCompleteProductCatalog(): Promise<Product[]> {
  const products: Product[] = [];
  let currentPage = 1;
  let numberOfPages = 1;

  do {
    const query = new URLSearchParams({
      limit: "40",
      page: String(currentPage),
    });
    const response = await fetch(
      `https://ecommerce.routemisr.com/api/v1/products?${query.toString()}`,
      { next: { revalidate: 60 } },
    );
    if (!response.ok) throw new Error("Failed to fetch products");

    const result: PaginatedProductsResponse = await response.json();
    products.push(...result.data);
    numberOfPages = result.metadata.numberOfPages;
    currentPage += 1;
  } while (currentPage <= numberOfPages);

  return products;
}