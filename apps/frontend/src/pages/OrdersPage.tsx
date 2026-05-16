import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { extractError, ordersApi } from "../lib/api";
import { ErrorAlert } from "../components/ErrorAlert";
import { Loading } from "../components/Loading";

export function OrdersPage() {
  const ordersQuery = useQuery({ queryKey: ["orders"], queryFn: ordersApi.list });

  if (ordersQuery.isLoading) return <Loading />;
  if (ordersQuery.isError) {
    return <ErrorAlert message={extractError(ordersQuery.error, "Failed to load orders")} />;
  }
  const orders = ordersQuery.data ?? [];

  return (
    <div data-testid="orders-page">
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">Your orders</h1>

      {orders.length === 0 ? (
        <div data-testid="empty-orders" className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          You don't have any orders yet.{" "}
          <Link to="/products" className="underline">Start shopping</Link>.
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li
              key={order.id}
              data-testid="order-card"
              data-order-id={order.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Order <span data-testid="order-id" className="font-mono">#{order.id}</span>
                  </p>
                  <p className="text-xs text-slate-600">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p data-testid="order-status" className="text-xs uppercase tracking-wide text-slate-500">
                    {order.status}
                  </p>
                  <p data-testid="order-total" className="text-lg font-semibold text-slate-900">
                    ${order.total}
                  </p>
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {order.items.map((it) => (
                  <li key={it.id} data-testid="order-line-item">
                    {it.product_name} × {it.quantity} — ${it.unit_price}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
