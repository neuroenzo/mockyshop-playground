import { apiFetch } from "@/lib/api";
import type {
  OrderFilter,
  OrderPaginatedResponse,
  OrderResponse,
  OrderStatusUpdate,
} from "@/types/api";

function buildQuery(filter: OrderFilter): string {
  const params = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function getOrders(filter: OrderFilter = {}): Promise<OrderPaginatedResponse> {
  return apiFetch<OrderPaginatedResponse>(`/orders/${buildQuery(filter)}`);
}

export function getOrder(id: number): Promise<OrderResponse> {
  return apiFetch<OrderResponse>(`/orders/${id}`);
}

export function createOrder(): Promise<OrderResponse> {
  return apiFetch<OrderResponse>("/orders/", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function updateOrderStatus(id: number, data: OrderStatusUpdate): Promise<OrderResponse> {
  return apiFetch<OrderResponse>(`/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function shipOrder(id: number): Promise<OrderResponse> {
  return apiFetch<OrderResponse>(`/orders/${id}/ship`, {
    method: "PATCH",
  });
}

export function deleteOrder(id: number): Promise<void> {
  return apiFetch<void>(`/orders/${id}`, {
    method: "DELETE",
  });
}
