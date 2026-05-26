"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCart, removeCartItem, clearCart, updateCartItem } from "@/lib/queries/cart";
import { createOrder } from "@/lib/queries/orders";
import type { CartResponse } from "@/types/api";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

function CartPage() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);

  const fetchCart = () => {
    setLoading(true);
    getCart()
      .then(setCart)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCart(); }, []);

  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeCartItem(itemId);
      fetchCart();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove item");
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      fetchCart();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to clear cart");
    }
  };

  const handleUpdateQty = async (itemId: number, quantity: number) => {
    const item = cart?.items.find((i) => i.id === itemId);
    if (!item) return;
    try {
      await updateCartItem(itemId, { product_id: item.product_id, quantity });
      fetchCart();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update quantity");
    }
  };

  const handleOrder = async () => {
    setOrdering(true);
    try {
      const order = await createOrder();
      fetchCart();
      if (typeof window !== "undefined") {
        window.location.href = `/orders/${order.id}`;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchCart} />;
  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Add some products to get started."
      >
        <Link href="/products">
          <Button>Browse Products</Button>
        </Link>
      </EmptyState>
    );
  }

  return (
    <div data-testid="cart-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Shopping Cart</h1>
        <Button variant="danger" size="sm" onClick={handleClearCart} testId="btn-clear-cart">Clear Cart</Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-line overflow-hidden">
        <table className="min-w-full divide-y divide-gray-line">
          <thead className="bg-gray-lighter">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-txt uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-txt uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-txt uppercase">Qty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-txt uppercase">Total</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-txt uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-line">
            {cart.items.map((item) => {
              const product = item.product as { name?: string; price?: string };
              return (
                <tr key={item.id} data-testid={`cart-item-${item.id}`} className="hover:bg-gray-lighter">
                  <td className="px-6 py-4 text-sm text-gray-dark">{product.name ?? `Product #${item.product_id}`}</td>
                  <td className="px-6 py-4 text-sm text-gray-dark">${product.price ?? "—"}</td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleUpdateQty(item.id, Number(e.target.value))}
                      className="w-16 rounded border border-gray-line px-2 py-1 text-sm"
                      data-testid={`cart-item-qty-${item.id}`}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-dark">${(Number(product.price ?? 0) * item.quantity).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                      data-testid={`cart-item-remove-${item.id}`}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-line p-6 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold">Total: <span className="text-primary">${cart.total_amount}</span></p>
          <p className="text-sm text-gray-txt">{cart.total_items} items</p>
        </div>
        <Button onClick={handleOrder} loading={ordering} size="lg" testId="btn-place-order">
          Place Order
        </Button>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard roles={["buyer"]}>
      <CartPage />
    </AuthGuard>
  );
}
