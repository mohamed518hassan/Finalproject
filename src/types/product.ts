export interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  description?: string;
}
export interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  category: string;
}
export interface Brand {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
}
export interface Product {
  _id: string;
  title: string;
  price: number;
  priceAfterDiscount?: number;
  imageCover: string;
  ratingsAverage: number;
  quantity?: number;
  category: {
    _id: string;
    name: string;
    slug?: string;
    image?: string;
  };
  subcategory?: Subcategory[];

  brand?: Brand;
  ratingsQuantity?: number;
}