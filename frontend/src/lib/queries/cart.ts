import { apiFetch } from "@/lib/api";
import type { CartItemCreate, CartItemResponse, CartResponse } from "@/types/api";

export function getCart(): Promise<CartResponse> {
  return apiFetch<CartResponse>("/cart/");
}

export function addCartItem(data: CartItemCreate): Promise<CartItemResponse> {
  return apiFetch<CartItemResponse>("/cart/items", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCartItem(itemId: number, data: CartItemCreate): Promise<CartItemResponse> {
  return apiFetch<CartItemResponse>(`/cart/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function removeCartItem(itemId: number): Promise<void> {
  return apiFetch<void>(`/cart/items/${itemId}`, {
    method: "DELETE",
  });
}

export function clearCart(): Promise<void> {
  return apiFetch<void>("/cart/", {
    method: "DELETE",
  });
}
