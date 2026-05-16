import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { cartApi, checkoutApi, extractError } from "../lib/api";
import { ErrorAlert } from "../components/ErrorAlert";
import { Loading } from "../components/Loading";
import { useState } from "react";
import type { Order } from "../lib/types";

export function CheckoutPage() {
  const queryClient = useQueryClient();
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.get,
    enabled: !confirmedOrder,
  });

  const submit = useMutation({
    mutationFn: checkoutApi.submit,
    onSuccess: (order) => {
      setError(null);
      setConfirmedOrder(order);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err) => setError(extractError(err, "Checkout failed")),
  });

  if (confirmedOrder) {
    return (
      <div data-testid="order-confirmation" className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <h1 className="text-xl font-semibold text-emerald-900">Order placed</h1>
        <p className="mt-2 text-sm text-emerald-900">
          Thanks for your order. Your confirmation number is{" "}
          <span data-testid="order-confirmation-id" className="font-mono">
            #{confirmedOrder.id}
          </span>
          .
        </p>
        <p className="mt-1 text-sm text-emerald-900">
          Total charged:{" "}
          <span data-testid="order-confirmation-total" className="font-semibold">
            ${confirmedOrder.total}
          </span>
        </p>
        <Link
          to="/orders"
          data-testid="view-orders-link"
          className="mt-4 inline-block text-sm font-medium text-emerald-900 underline"
        >
          View order history
        </Link>
      </div>
    );
  }

  if (cartQuery.isLoading) return <Loading />;
  if (cartQuery.isError) {
    return <ErrorAlert message={extractError(cartQuery.error, "Failed to load cart")} />;
  }
  const cart = cartQuery.data;
  if (!cart) return null;

  return (
    <div data-testid="checkout-page">
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">Checkout</h1>

      {cart.items.length === 0 ? (
        <div data-testid="checkout-empty" className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Your cart is empty. <Link to="/products" className="underline">Continue shopping</Link>.
        </div>
      ) : (
        <>
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {cart.items.map((item) => (
              <li
                key={item.id}
                data-testid="checkout-line-item"
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span>
                  {item.product.name} × {item.quantity}
                </span>
                <span className="font-medium">${item.line_total}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">Total</span>
            <span data-testid="checkout-total" className="text-lg font-semibold">
              ${cart.total}
            </span>
          </div>

          {error && (
            <div className="mt-4">
              <ErrorAlert message={error} />
            </div>
          )}

          <button
            type="button"
            data-testid="checkout-submit"
            onClick={() => submit.mutate()}
            disabled={submit.isPending}
            className="mt-6 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:bg-slate-400"
          >
            {submit.isPending ? "Placing order…" : "Place order"}
          </button>
        </>
      )}
    </div>
  );
}
