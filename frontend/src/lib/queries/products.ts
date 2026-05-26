import { apiFetch } from "@/lib/api";
import type {
  Product,
  ProductCreate,
  ProductFilter,
  ProductImage,
  ProductPaginatedResponse,
  UploadImageResponse,
} from "@/types/api";

function buildQuery(filter: ProductFilter): string {
  const params = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function getProducts(filter: ProductFilter = {}): Promise<ProductPaginatedResponse> {
  return apiFetch<ProductPaginatedResponse>(`/products/${buildQuery(filter)}`);
}

export function getProduct(id: number): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`);
}

export function getProductImages(id: number): Promise<ProductImage[]> {
  return apiFetch<ProductImage[]>(`/products/${id}/images`);
}

export function getProductsByCategory(categoryId: number): Promise<Product[]> {
  return apiFetch<Product[]>(`/products/category/${categoryId}`);
}

export function createProduct(data: ProductCreate): Promise<Product> {
  return apiFetch<Product>("/products/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProduct(id: number, data: ProductCreate): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteProduct(id: number): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`, {
    method: "DELETE",
  });
}

export function deleteProductImage(productId: number, imageId: number): Promise<void> {
  return apiFetch<void>(`/products/${productId}/images/${imageId}`, {
    method: "DELETE",
  });
}

export function uploadProductImages(
  productId: number,
  files: FileList,
  isMain?: boolean,
): Promise<UploadImageResponse> {
  const formData = new FormData();
  Array.from(files).forEach((f) => formData.append("files", f));
  const params = isMain ? "?is_main=true" : "";
  return apiFetch<UploadImageResponse>(`/products/${productId}/images${params}`, {
    method: "POST",
    body: formData,
  });
}
