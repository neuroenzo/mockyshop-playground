"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getCheckout, payOrder } from "@/lib/queries/payments";
import { getOrder } from "@/lib/queries/orders";
import type { CheckoutResponse, OrderResponse } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { TableSkeleton } from "@/components/ui/Skeleton";

function CheckoutPage() {
  const { order_id } = useParams<{ order_id: string }>();
  useAuth();
  const router = useRouter();
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState("mock");

  const loadData = () => {
    if (!order_id) return;
    setLoading(true);
    setLoadError(null);
    Promise.all([
      getCheckout(Number(order_id)),
      getOrder(Number(order_id)),
    ])
      .then(([c, o]) => {
        setCheckout(c);
        setOrder(o);
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Failed to load checkout"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [order_id]);

  const handlePay = async () => {
    setPaying(true);
    setPayError(null);
    try {
      await payOrder(Number(order_id), { payment_method: payMethod as "card" | "cash" | "mock" });
      router.push('/orders');
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <TableSkeleton rows={4} />;
  if (loadError) return <ErrorMessage message={loadError} onRetry={loadData} />;

  if (!checkout || !order) return <ErrorMessage message="Checkout not found" onRetry={loadData} />;

  if (order.status !== "pending") {
    return (
      <div data-testid="checkout-done" className="max-w-lg mx-auto text-center mt-16">
        <div className="bg-white rounded-lg shadow-sm border border-gray-line p-8">
          <h1 className="text-2xl font-bold mb-2">Order #{order_id}</h1>
          <p className="text-gray-txt mb-2">This order is <strong>{order.status}</strong>.</p>
          <p className="text-gray-txt mb-6">No payment is needed.</p>
          <Link href="/orders">
            <Button>View My Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="checkout-page" className="max-w-2xl mx-auto">
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: "Orders", href: "/orders" },
        { label: `Checkout #${order_id}` },
      ]} />
      <h1 className="text-2xl font-bold mb-2">Checkout</h1>
      <p className="text-gray-txt mb-6">Review your order and choose a payment method below.</p>

      <div className="bg-white rounded-lg shadow-sm border border-gray-line p-6 mb-6">
        <h2 className="font-semibold mb-4">Order #{checkout.order_id} &mdash; {checkout.message}</h2>

        <table className="min-w-full divide-y divide-gray-line">
          <thead className="bg-gray-lighter">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-txt uppercase">Product</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-txt uppercase">Price</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-txt uppercase">Count</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-txt uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-line">
            {checkout.items.map((item, idx) => (
              <tr key={item.product_id} data-testid={`checkout-item-${idx}`}>
                <td className="px-4 py-2 text-sm">{item.name}</td>
                <td className="px-4 py-2 text-sm">${item.unit_price}</td>
                <td className="px-4 py-2 text-sm">{item.quantity}</td>
                <td className="px-4 py-2 text-sm font-medium">${item.total_price}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 text-right">
          <p className="text-xl font-bold">Total: <span className="text-primary">${checkout.total_amount}</span></p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-line p-6">
        <h3 className="font-semibold mb-4">Payment Method</h3>
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
          <Button onClick={handlePay} loading={paying} className="w-full" testId="btn-checkout-pay">
            Pay ${checkout.total_amount}
          </Button>

          {payError && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-700">{payError}</p>
            </div>
          )}

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => router.push('/orders')}
            type="button"
            testId="btn-cancel-checkout"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard roles={["buyer"]}>
      <CheckoutPage />
    </AuthGuard>
  );
}
