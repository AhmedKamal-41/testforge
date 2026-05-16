import { Link } from "react-router-dom";
import type { Product } from "../lib/types";

type Props = {
  product: Product;
  onAddToCart: (product: Product) => void;
  isAdding?: boolean;
};

export function ProductCard({ product, onAddToCart, isAdding }: Props) {
  return (
    <div
      data-testid="product-card"
      data-product-id={product.id}
      className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex h-32 items-center justify-center rounded-md bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
        {product.category}
      </div>
      <Link
        to={`/products/${product.id}`}
        data-testid="product-title"
        className="text-base font-medium text-slate-900 hover:underline"
      >
        {product.name}
      </Link>
      <p className="mt-1 text-sm text-slate-500" data-testid="product-description">
        {product.description}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <span data-testid="product-price" className="text-base font-semibold text-slate-900">
          ${product.price}
        </span>
        <button
          type="button"
          data-testid="add-to-cart"
          disabled={isAdding || product.stock === 0}
          onClick={() => onAddToCart(product)}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {product.stock === 0 ? "Out of stock" : isAdding ? "Adding…" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
