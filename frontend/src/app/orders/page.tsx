"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getOrders } from "@/lib/queries/orders";
import type { OrderResponse, OrderFilter } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";

function OrdersPage() {
  const { isRole } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const size = 10;

  const buildFilter = useCallback((): OrderFilter => {
    const filter: OrderFilter = { page, size };
    if (statusFilter) filter.status = statusFilter;
    return filter;
  }, [page, size, statusFilter]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOrders(buildFilter());
      setOrders(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [buildFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => { setPage(1); }, [statusFilter]);

  return (
    <div data-testid="orders-page">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>

      <div className="mb-4 max-w-xs">
        <Select
          name="status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          placeholder="All statuses"
          options={[
            { value: "pending", label: "Pending" },
            { value: "paid", label: "Paid" },
            { value: "shipped", label: "Shipped" },
            { value: "delivered", label: "Delivered" },
            { value: "cancelled", label: "Cancelled" },
          ]}
        />
      </div>

      {loading && <Spinner />}
      {error && <ErrorMessage message={error} onRetry={fetchOrders} />}

      {!loading && !error && orders.length === 0 && (
        <EmptyState title="No orders found" description="Place your first order from the cart." />
      )}

      {!loading && orders.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-line overflow-hidden">
          <table className="min-w-full divide-y divide-gray-line" data-testid="orders-table">
            <thead className="bg-gray-lighter">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-txt uppercase">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-txt uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-txt uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-txt uppercase">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-txt uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-line">
              {orders.map((o) => (
                <tr key={o.id} data-testid={`order-row-${o.id}`} className="hover:bg-gray-lighter">
                  <td className="px-6 py-4 text-sm font-medium text-gray-dark">#{o.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-txt">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4"><Badge variant={o.status}>{o.status}</Badge></td>
                  <td className="px-6 py-4 text-sm text-gray-dark">${o.total_amount}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/orders/${o.id}`} data-testid={`order-view-${o.id}`} className="text-sm text-primary hover:text-primary">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pages={pages} total={total} size={size} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard>
      <OrdersPage />
    </AuthGuard>
  );
}
