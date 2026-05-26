"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getOrder, shipOrder, updateOrderStatus, deleteOrder } from "@/lib/queries/orders";
import { getCheckout, payOrder } from "@/lib/queries/payments";
import type { OrderResponse, CheckoutResponse } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";

function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isRole } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [payMethod, setPayMethod] = useState("mock");

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const o = await getOrder(Number(id));
      setOrder(o);
      if (isRole("buyer") && o.status === "pending") {
        getCheckout(Number(id)).then(setCheckout).catch(() => {});
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handlePay = async () => {
    setActionLoading(true);
    try {
      await payOrder(Number(id), { payment_method: payMethod as "card" | "cash" | "mock" });
      fetchOrder();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleShip = async () => {
    setActionLoading(true);
    try {
      await shipOrder(Number(id));
      fetchOrder();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to ship");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    setActionLoading(true);
    try {
      await updateOrderStatus(Number(id), { status: status as "paid" | "shipped" | "delivered" | "cancelled" });
      fetchOrder();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this order?")) return;
    setActionLoading(true);
    try {
      await deleteOrder(Number(id));
      router.push("/orders");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchOrder} />;
  if (!order) return <ErrorMessage message="Order not found" />;

  return (
    <div data-testid="order-detail-page">
      <Link href="/orders" className="text-sm text-primary hover:text-primary">&larr; Back to orders</Link>

      <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-line p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Order #{order.id}</h1>
            <p className="text-sm text-gray-txt mt-1">{new Date(order.created_at).toLocaleString()}</p>
          </div>
          <Badge variant={order.status} data-testid={`order-status-${order.status}`}>{order.status}</Badge>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-3">Items</h3>
          <table className="min-w-full divide-y divide-gray-line">
            <thead className="bg-gray-lighter">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-txt uppercase">Product</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-txt uppercase">Price</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-txt uppercase">Qty</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-txt uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-line">
              {order.items.map((item) => {
                const product = item.product as { name?: string };
                return (
                  <tr key={item.id} data-testid={`order-item-${item.id}`}>
                    <td className="px-4 py-2 text-sm">{product.name ?? `Product #${item.product_id}`}</td>
                    <td className="px-4 py-2 text-sm">${item.price}</td>
                    <td className="px-4 py-2 text-sm">{item.quantity}</td>
                    <td className="px-4 py-2 text-sm font-medium">${(Number(item.price) * item.quantity).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-right">
          <p className="text-xl font-bold">Total: <span className="text-primary">${order.total_amount}</span></p>
        </div>
      </div>

      {/* Payment section (buyer, pending orders) */}
      {isRole("buyer") && order.status === "pending" && checkout && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-line p-6">
          <h3 className="font-semibold mb-4">Payment</h3>
          <div className="max-w-xs space-y-4">
            <Select
              name="payment_method"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              options={[
                { value: "mock", label: "Mock Payment" },
                { value: "card", label: "Card" },
                { value: "cash", label: "Cash" },
              ]}
            />
            <Button onClick={handlePay} loading={actionLoading} testId="btn-pay-order">Pay ${order.total_amount}</Button>
          </div>
        </div>
      )}

      {/* Seller: ship button */}
      {isRole("seller") && order.status === "paid" && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-line p-6">
          <Button onClick={handleShip} loading={actionLoading} testId="btn-ship-order">Mark as Shipped</Button>
        </div>
      )}

      {/* Admin: status update + delete */}
      {isRole("admin") && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-line p-6 space-y-4">
          <h3 className="font-semibold">Admin Actions</h3>
          <div className="flex gap-2 flex-wrap">
            {["paid", "shipped", "delivered", "cancelled"].map((s) => (
              <Button
                key={s}
                variant={order.status === s ? "primary" : "secondary"}
                size="sm"
                onClick={() => handleUpdateStatus(s)}
                disabled={actionLoading}
                testId={`btn-set-status-${s}`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>
          <Button variant="danger" onClick={handleDelete} loading={actionLoading} testId="btn-delete-order">Delete Order</Button>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard>
      <OrderDetailPage />
    </AuthGuard>
  );
}
