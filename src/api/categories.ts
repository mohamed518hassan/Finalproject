import type { Category, Product, Subcategory } from "@/types/product";

const API_BASE_URL = "https://ecommerce.routemisr.com/api/v1";
const PAGE_SIZE = 40;

interface ApiCollection<T> {
  data: T[];
  results: number;
  metadata: {
    currentPage: number;
    numberOfPages: number;
    limit: number;
    nextPage?: number;
  };
}

async function fetchCollection<T>(url: string): Promise<ApiCollection<T>> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json() as Promise<ApiCollection<T>>;
}

export async function getCategories(): Promise<Category[]> {
  const result = await fetchCollection<Category>(`${API_BASE_URL}/categories`);
  return result.data;
}

export async function getCategoryDetails(categoryId: string): Promise<Category> {
  const response = await fetch(`${API_BASE_URL}/categories/${encodeURIComponent(categoryId)}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Unable to load category (${response.status})`);
  }
  const result = await response.json() as { data: Category };
  return result.data;
}

export async function getCategorySubcategories(categoryId: string): Promise<Subcategory[]> {
  const result = await fetchCollection<Subcategory>(
    `${API_BASE_URL}/categories/${encodeURIComponent(categoryId)}/subcategories`,
  );
  return result.data.filter((subcategory) => subcategory.category === categoryId);
}

export async function getCategoryProducts(categoryId: string): Promise<Product[]> {
  const products: Product[] = [];
  let currentPage = 1;
  let numberOfPages = 1;

  do {
    const query = new URLSearchParams({
      "category[in]": categoryId,
      limit: String(PAGE_SIZE),
      page: String(currentPage),
    });
    const result = await fetchCollection<Product>(
      `${API_BASE_URL}/products?${query.toString()}`,
    );
    products.push(...result.data);
    numberOfPages = result.metadata.numberOfPages;
    currentPage += 1;
  } while (currentPage <= numberOfPages);

  return products;
}