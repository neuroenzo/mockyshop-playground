import { apiFetch } from "@/lib/api";
import type { CheckoutResponse, PaymentCreate, PaymentResponse } from "@/types/api";

export function getCheckout(orderId: number): Promise<CheckoutResponse> {
  return apiFetch<CheckoutResponse>(`/checkout/${orderId}`);
}

export function payOrder(orderId: number, data: PaymentCreate): Promise<PaymentResponse> {
  return apiFetch<PaymentResponse>(`/checkout/${orderId}/pay`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
