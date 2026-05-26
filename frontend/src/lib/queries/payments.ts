import { apiFetch } from "@/lib/api";
import type { CheckoutResponse, PaymentCreate, PaymentResponse } from "@/types/api";

export function getCheckout(orderId: number): Promise<CheckoutResponse> {
  return apiFetch<CheckoutResponse>(`/orders/${orderId}/checkout`);
}

export function payOrder(orderId: number, data: PaymentCreate): Promise<PaymentResponse> {
  return apiFetch<PaymentResponse>(`/orders/${orderId}/pay`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
