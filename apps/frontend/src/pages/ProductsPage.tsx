import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartApi, extractError, productsApi } from "../lib/api";
import { useAuth } from "../stores/auth";
import { useNavigate } from "react-router-dom";
import type { Product } from "../lib/types";
import { ProductCard } from "../components/ProductCard";
import { ErrorAlert } from "../components/ErrorAlert";
import { Loading } from "../components/Loading";
import { useState } from "react";

export function ProductsPage() {
  const navigate = useNavigate();
  const token = useAuth((s) => s.token);
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: productsApi.list,
  });

  const addToCart = useMutation({
    mutationFn: (product: Product) => cartApi.add(product.id, 1),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (err) => setActionError(extractError(err, "Could not add to cart")),
    onSettled: () => setPendingId(null),
  });

  const handleAdd = (product: Product) => {
    if (!token) {
      navigate("/login");
      return;
    }
    setPendingId(product.id);
    addToCart.mutate(product);
  };

  return (
    <div data-testid="products-page">
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">Products</h1>

      {productsQuery.isLoading && <Loading />}

      {productsQuery.isError && (
        <ErrorAlert message={extractError(productsQuery.error, "Failed to load products")} />
      )}

      {productsQuery.data && productsQuery.data.length === 0 && (
        <p data-testid="empty-products" className="text-sm text-slate-500">
          No products available.
        </p>
      )}

      {actionError && (
        <div className="mb-4">
          <ErrorAlert message={actionError} />
        </div>
      )}

      {productsQuery.data && productsQuery.data.length > 0 && (
        <div
          data-testid="product-grid"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {productsQuery.data.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              isAdding={pendingId === p.id}
              onAddToCart={handleAdd}
            />
          ))}
        </div>
      )}
    </div>
  );
}
