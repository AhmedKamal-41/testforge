import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { cartApi, extractError, productsApi } from "../lib/api";
import { useAuth } from "../stores/auth";
import { ErrorAlert } from "../components/ErrorAlert";
import { Loading } from "../components/Loading";
import { useState } from "react";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const navigate = useNavigate();
  const token = useAuth((s) => s.token);
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const productQuery = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productsApi.get(productId),
    enabled: Number.isFinite(productId),
  });

  const addToCart = useMutation({
    mutationFn: () => cartApi.add(productId, 1),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      navigate("/cart");
    },
    onError: (err) => setActionError(extractError(err, "Could not add to cart")),
  });

  if (productQuery.isLoading) return <Loading />;
  if (productQuery.isError || !productQuery.data) {
    return <ErrorAlert message={extractError(productQuery.error, "Product not found")} />;
  }

  const product = productQuery.data;

  return (
    <article data-testid="product-detail" className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="flex h-64 items-center justify-center rounded-lg bg-slate-100 text-sm uppercase tracking-wide text-slate-600">
        {product.category}
      </div>
      <div>
        <h1 data-testid="product-detail-title" className="text-2xl font-semibold text-slate-900">
          {product.name}
        </h1>
        <p data-testid="product-detail-price" className="mt-2 text-xl text-slate-900">
          ${product.price}
        </p>
        <p data-testid="product-detail-description" className="mt-4 text-sm text-slate-600">
          {product.description}
        </p>
        <p data-testid="product-detail-stock" className="mt-2 text-xs text-slate-500">
          {product.stock} in stock
        </p>

        {actionError && (
          <div className="mt-4">
            <ErrorAlert message={actionError} />
          </div>
        )}

        <button
          type="button"
          data-testid="add-to-cart"
          disabled={addToCart.isPending || product.stock === 0}
          onClick={() => {
            if (!token) {
              navigate("/login");
              return;
            }
            addToCart.mutate();
          }}
          className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:bg-slate-400"
        >
          {product.stock === 0
            ? "Out of stock"
            : addToCart.isPending
              ? "Adding…"
              : "Add to cart"}
        </button>
      </div>
    </article>
  );
}
