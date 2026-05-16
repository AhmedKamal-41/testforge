import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminProductsApi, extractError, productsApi } from "../lib/api";
import type { Product } from "../lib/types";
import { ErrorAlert } from "../components/ErrorAlert";
import { Loading } from "../components/Loading";

type FormState = {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  image_url: string;
};

const blankForm: FormState = {
  name: "",
  description: "",
  price: "0.00",
  stock: "0",
  category: "general",
  image_url: "",
};

function toPayload(form: FormState) {
  return {
    name: form.name.trim(),
    description: form.description,
    price: form.price,
    stock: Number(form.stock),
    category: form.category.trim() || "general",
    image_url: form.image_url,
  };
}

function fromProduct(p: Product): FormState {
  return {
    name: p.name,
    description: p.description,
    price: String(p.price),
    stock: String(p.stock),
    category: p.category,
    image_url: p.image_url,
  };
}

export function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const productsQuery = useQuery({ queryKey: ["products"], queryFn: productsApi.list });

  const create = useMutation({
    mutationFn: (data: ReturnType<typeof toPayload>) =>
      adminProductsApi.create({ ...data, price: data.price }),
    onSuccess: () => {
      setFlash("Product created");
      setForm(blankForm);
      setEditingId(null);
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) => setFormError(extractError(err, "Could not create product")),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReturnType<typeof toPayload> }) =>
      adminProductsApi.update(id, data),
    onSuccess: () => {
      setFlash("Product updated");
      setForm(blankForm);
      setEditingId(null);
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) => setFormError(extractError(err, "Could not update product")),
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminProductsApi.remove(id),
    onSuccess: () => {
      setFlash("Product deleted");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) => setFormError(extractError(err, "Could not delete product")),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFlash(null);
    setFormError(null);
    if (!form.name.trim()) {
      setFormError("Name is required");
      return;
    }
    const payload = toPayload(form);
    if (editingId === null) {
      create.mutate(payload);
    } else {
      update.mutate({ id: editingId, data: payload });
    }
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setForm(fromProduct(p));
    setFormError(null);
    setFlash(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(blankForm);
    setFormError(null);
  };

  const updateField = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div data-testid="admin-products-page" className="space-y-8">
      <h1 className="text-2xl font-semibold text-slate-900">Manage products</h1>

      <section>
        <h2 className="mb-2 text-lg font-medium text-slate-900">
          {editingId === null ? "New product" : `Edit product #${editingId}`}
        </h2>

        {flash && (
          <div data-testid="admin-flash" className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {flash}
          </div>
        )}
        {formError && (
          <div className="mb-3">
            <ErrorAlert message={formError} />
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          data-testid="admin-product-form"
          className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2"
        >
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Name</span>
            <input
              data-testid="admin-input-name"
              value={form.name}
              onChange={updateField("name")}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Category</span>
            <input
              data-testid="admin-input-category"
              value={form.category}
              onChange={updateField("category")}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Price</span>
            <input
              data-testid="admin-input-price"
              value={form.price}
              onChange={updateField("price")}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              inputMode="decimal"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Stock</span>
            <input
              data-testid="admin-input-stock"
              value={form.stock}
              onChange={updateField("stock")}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              inputMode="numeric"
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-slate-600">Image URL</span>
            <input
              data-testid="admin-input-image-url"
              value={form.image_url}
              onChange={updateField("image_url")}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-slate-600">Description</span>
            <textarea
              data-testid="admin-input-description"
              value={form.description}
              onChange={updateField("description")}
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <div className="flex gap-2 md:col-span-2">
            <button
              type="submit"
              data-testid="admin-save"
              disabled={create.isPending || update.isPending}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:bg-slate-400"
            >
              {editingId === null ? "Create product" : "Save changes"}
            </button>
            {editingId !== null && (
              <button
                type="button"
                data-testid="admin-cancel"
                onClick={handleCancel}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium text-slate-900">All products</h2>
        {productsQuery.isLoading && <Loading />}
        {productsQuery.isError && (
          <ErrorAlert message={extractError(productsQuery.error, "Failed to load products")} />
        )}
        {productsQuery.data && (
          <table data-testid="admin-products-table" className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-700">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {productsQuery.data.map((p) => (
                <tr key={p.id} data-testid="admin-product-row" data-product-id={p.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono text-xs">{p.id}</td>
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2">{p.category}</td>
                  <td className="px-3 py-2">${p.price}</td>
                  <td className="px-3 py-2">{p.stock}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      data-testid="admin-edit"
                      onClick={() => handleEdit(p)}
                      className="mr-2 rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      data-testid="admin-delete"
                      onClick={() => remove.mutate(p.id)}
                      disabled={remove.isPending}
                      className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
