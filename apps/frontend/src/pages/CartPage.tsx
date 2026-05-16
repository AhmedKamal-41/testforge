import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { cartApi, extractError } from "../lib/api";
import { ErrorAlert } from "../components/ErrorAlert";
import { Loading } from "../components/Loading";
import { useState } from "react";

export function CartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.get,
  });

  const removeItem = useMutation({
    mutationFn: (id: number) => cartApi.remove(id),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (err) => setActionError(extractError(err, "Could not remove item")),
  });

  if (cartQuery.isLoading) return <Loading />;
  if (cartQuery.isError) {
    return <ErrorAlert message={extractError(cartQuery.error, "Failed to load cart")} />;
  }
  const cart = cartQuery.data;
  if (!cart) return null;

  return (
    <div data-testid="cart-page">
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">Your cart</h1>

      {actionError && (
        <div className="mb-4">
          <ErrorAlert message={actionError} />
        </div>
      )}

      {cart.items.length === 0 ? (
        <div data-testid="empty-cart" className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
          <p className="text-sm text-slate-500">Your cart is empty.</p>
          <Link
            to="/products"
            data-testid="continue-shopping"
            className="mt-3 inline-block text-sm font-medium text-slate-900 underline"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {cart.items.map((item) => (
              <li
                key={item.id}
                data-testid="cart-item"
                data-product-id={item.product.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p data-testid="cart-item-name" className="font-medium text-slate-900">
                    {item.product.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    <span data-testid="cart-item-quantity">{item.quantity}</span> ×{" "}
                    <span data-testid="cart-item-price">${item.product.price}</span>
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span data-testid="cart-item-total" className="font-semibold text-slate-900">
                    ${item.line_total}
                  </span>
                  <button
                    type="button"
                    data-testid="remove-cart-item"
                    onClick={() => removeItem.mutate(item.id)}
                    disabled={removeItem.isPending}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">Total</span>
            <span data-testid="cart-total" className="text-lg font-semibold text-slate-900">
              ${cart.total}
            </span>
          </div>

          <button
            type="button"
            data-testid="checkout-button"
            onClick={() => navigate("/checkout")}
            className="mt-6 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Proceed to checkout
          </button>
        </>
      )}
    </div>
  );
}
