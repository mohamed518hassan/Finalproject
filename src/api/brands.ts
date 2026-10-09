import type { Brand, Product } from "@/types/product";

const API_BASE_URL = "https://ecommerce.routemisr.com/api/v1";
const BRAND_PAGE_SIZE = 50;
const PRODUCT_PAGE_SIZE = 40;

interface ApiCollection<T> {
  data: T[];
  metadata: {
    numberOfPages: number;
  };
}

async function fetchCollection<T>(url: string): Promise<ApiCollection<T>> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json() as Promise<ApiCollection<T>>;
}

export async function getBrands(): Promise<Brand[]> {
  const brands: Brand[] = [];
  let currentPage = 1;
  let numberOfPages = 1;

  do {
    const query = new URLSearchParams({
      limit: String(BRAND_PAGE_SIZE),
      page: String(currentPage),
    });
    const result = await fetchCollection<Brand>(
      `${API_BASE_URL}/brands?${query.toString()}`,
    );
    brands.push(...result.data);
    numberOfPages = result.metadata.numberOfPages;
    currentPage += 1;
  } while (currentPage <= numberOfPages);

  return brands;
}

export async function getProductsByBrand(brandId: string): Promise<Product[]> {
  const products: Product[] = [];
  let currentPage = 1;
  let numberOfPages = 1;

  do {
    const query = new URLSearchParams({
      brand: brandId,
      limit: String(PRODUCT_PAGE_SIZE),
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