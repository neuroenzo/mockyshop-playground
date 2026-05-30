"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { getProducts, deleteProduct } from "@/lib/queries/products";
import { getCart, addCartItem, updateCartItem, removeCartItem } from "@/lib/queries/cart";
import { getCategories } from "@/lib/queries/categories";
import type { Product, ProductFilter, Category } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default function ProductsPage() {
  const { isRole } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const size = 12;

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<ProductFilter["sort_by"]>("newest");

  const buildFilter = useCallback((): ProductFilter => {
    const filter: ProductFilter = { page, size };
    if (search) filter.search = search;
    if (categoryId) filter.category_id = categoryId;
    if (minPrice) filter.min_price = minPrice;
    if (maxPrice) filter.max_price = maxPrice;
    filter.sort_by = sortBy;
    return filter;
  }, [page, size, search, categoryId, minPrice, maxPrice, sortBy]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, cats] = await Promise.all([
        getProducts(buildFilter()),
        getCategories(),
      ]);
      setProducts(prodRes.items);
      setTotal(prodRes.total);
      setPages(prodRes.pages);
      setCategories(cats);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [buildFilter]);

  useEffect(() => {
    fetchData();
    getCart()
      .then((cart) => {
        const map: Record<number, { id: number; qty: number }> = {};
        cart.items.forEach((i) => { map[i.product_id] = { id: i.id, qty: i.quantity }; });
        setCartData(map);
      })
      .catch(() => {});
  }, [fetchData]);

  const handleFilterChange = () => {
    setPage(1);
  };

  useEffect(() => {
    handleFilterChange();
  }, [search, categoryId, minPrice, maxPrice, sortBy]);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [cartData, setCartData] = useState<Record<number, { id: number; qty: number }>>({});

  const handleDelete = async (id: number) => {
    setDeleteTarget(id);
  };

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const closeMenu = () => {
    setOpenMenuId(null);
    setMenuPos(null);
  };

  useEffect(() => {
    if (openMenuId === null) { setMenuPos(null); return; }
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    const scrollHandler = () => { closeMenu(); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("scroll", scrollHandler, true);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("scroll", scrollHandler, true);
    };
  }, [openMenuId]);

  const canManage = isRole("seller", "admin");

  const resetFilters = () => {
    setSearch("");
    setCategoryId(undefined);
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
  };

  const hasActiveFilters = search || categoryId || minPrice || maxPrice || sortBy !== "newest";

  return (
    <div data-testid="products-page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Products" }]} />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Products</h1>
          {isRole("buyer") && Object.keys(cartData).length > 0 && (
            <Link href="/cart" className="text-sm font-medium text-primary hover:text-primary underline" data-testid="link-view-cart">
              View Cart &rarr;
            </Link>
          )}
        </div>
        {canManage && (
          <Link href="/products/new">
            <Button testId="btn-new-product">New Product</Button>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-line p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Input
          name="search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          name="category_id"
          placeholder="All categories"
          value={categoryId?.toString() ?? ""}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
          options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
        />
        <Input
          name="min_price"
          type="number"
          step="0.01"
          placeholder="Min price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />
        <Input
          name="max_price"
          type="number"
          step="0.01"
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
        <Select
          name="sort_by"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as ProductFilter["sort_by"])}
          options={[
            { value: "newest", label: "Newest" },
            { value: "oldest", label: "Oldest" },
            { value: "price_asc", label: "Price: Low to High" },
            { value: "price_desc", label: "Price: High to Low" },
            { value: "name_asc", label: "Name: A-Z" },
            { value: "name_desc", label: "Name: Z-A" },
          ]}
        />
      </div>

      {hasActiveFilters && (
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={resetFilters} testId="btn-clear-filters">
            Clear all filters
          </Button>
        </div>
      )}

      {loading && <TableSkeleton rows={6} />}
      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      {!loading && !error && products.length === 0 && (
        <EmptyState title="No products found" description="Try changing filters." />
      )}

      {!loading && products.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-line overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-line" data-testid="products-table">
              <thead className="bg-gray-lighter">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-txt uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-txt uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-txt uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-txt uppercase">Category</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-txt uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-line">
                {products.map((p) => {
                  const catName = categories.find((c) => c.id === p.category_id)?.name ?? `#${p.category_id}`;
                  return (
                  <tr key={p.id} data-testid={`product-row-${p.id}`} className="hover:bg-gray-lighter">
                    <td className="px-6 py-4">
                      <Link href={`/products/${p.id}`} className="text-sm font-medium text-primary hover:text-primary">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-dark">${p.price}</td>
                    <td className="px-6 py-4 text-sm text-gray-txt">{p.stock}</td>
                    <td className="px-6 py-4 text-sm text-gray-txt">{catName}</td>
                    <td className="px-6 py-4 text-center text-sm">
                      {canManage ? (
                        <>
                          <button
                            onClick={(e) => {
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              setMenuPos({ top: rect.bottom + 4, left: rect.left });
                              setOpenMenuId(openMenuId === p.id ? null : p.id);
                            }}
                            className="inline-flex items-center justify-center rounded-md px-1 py-1 text-sm font-medium text-gray-txt hover:bg-gray-lighter focus:outline-none"
                            data-testid={`product-btn-actions-${p.id}`}
                          >
                            ⋯
                          </button>
                          {openMenuId === p.id && menuPos && (
                            <div
                              ref={menuRef}
                              style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 50 }}
                              className="rounded-md bg-white shadow-lg border border-gray-line py-1 flex flex-col"
                              data-testid={`product-actions-menu-${p.id}`}
                            >
                              <Link
                                href={`/products/${p.id}`}
                                className="block w-full text-left px-4 py-2 text-sm text-primary hover:bg-gray-lighter"
                                data-testid={`product-view-${p.id}`}
                                onClick={() => { closeMenu(); }}
                              >
                                View
                              </Link>
                              <Link
                                href={`/products/${p.id}/edit`}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-txt hover:bg-gray-lighter"
                                data-testid={`product-edit-${p.id}`}
                                onClick={() => { closeMenu(); }}
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => { closeMenu(); setDeleteTarget(p.id); }}
                                disabled={deletingId === p.id}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-lighter disabled:opacity-50"
                                data-testid={`product-delete-${p.id}`}
                              >
                                {deletingId === p.id ? "..." : "Delete"}
                              </button>
                            </div>
                          )}
                        </>
                      ) : isRole("buyer") ? (
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/products/${p.id}`} data-testid={`product-view-${p.id}`} className="text-sm text-primary hover:text-primary">
                            View
                          </Link>
                          {p.stock < 1 ? (
                            <span className="text-xs text-red-500">Out of stock</span>
                          ) : cartData[p.id] ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={async () => {
                                  const c = cartData[p.id];
                                  if (c.qty <= 1) {
                                    await removeCartItem(c.id);
                                    setCartData((prev) => { const next = { ...prev }; delete next[p.id]; return next; });
                                  } else {
                                    await updateCartItem(c.id, { product_id: p.id, quantity: c.qty - 1 });
                                    setCartData((prev) => ({ ...prev, [p.id]: { ...prev[p.id], qty: prev[p.id].qty - 1 } }));
                                  }
                                }}
                                disabled={cartData[p.id].qty <= 0}
                                className="w-6 h-6 rounded border border-gray-line text-gray-dark hover:bg-gray-lighter disabled:opacity-30 disabled:cursor-not-allowed text-sm leading-none"
                                data-testid={`btn-dec-${p.id}`}
                              >
                                −
                              </button>
                              <span className="w-6 text-center text-xs font-semibold" data-testid={`cart-qty-${p.id}`}>
                                {cartData[p.id].qty}
                              </span>
                              <button
                                onClick={async () => {
                                  if (cartData[p.id].qty >= p.stock) return;
                                  setAddingId(p.id);
                                  try {
                                    await addCartItem({ product_id: p.id, quantity: 1 });
                                    setCartData((prev) => ({ ...prev, [p.id]: { id: prev[p.id].id, qty: prev[p.id].qty + 1 } }));
                                  } catch { /* ignore */ }
                                  finally { setAddingId(null); }
                                }}
                                disabled={cartData[p.id].qty >= p.stock}
                                className="w-6 h-6 rounded border border-gray-line text-gray-dark hover:bg-gray-lighter disabled:opacity-30 disabled:cursor-not-allowed text-sm leading-none"
                                data-testid={`btn-inc-${p.id}`}
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={async () => {
                                setAddingId(p.id);
                                try {
                                  await addCartItem({ product_id: p.id, quantity: 1 });
                                  const cart = await getCart();
                                  const map: Record<number, { id: number; qty: number }> = {};
                                  cart.items.forEach((i) => { map[i.product_id] = { id: i.id, qty: i.quantity }; });
                                  setCartData((prev) => ({ ...prev, ...map }));
                                } catch { /* ignore */ }
                                finally { setAddingId(null); }
                              }}
                              loading={addingId === p.id}
                              testId={`btn-add-cart-${p.id}`}
                            >
                              Add to Cart
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Link href={`/products/${p.id}`} data-testid={`product-view-${p.id}`} className="text-sm text-primary hover:text-primary">
                          View
                        </Link>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            pages={pages}
            total={total}
            size={size}
            onPageChange={setPage}
          />
        </div>
      )}

      <ConfirmationModal
        open={deleteTarget !== null}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deletingId === deleteTarget}
        onConfirm={async () => {
          if (deleteTarget === null) return;
          setDeletingId(deleteTarget);
          try {
            await deleteProduct(deleteTarget);
            toast("Product deleted", "success");
            fetchData();
          } catch (err: unknown) {
            toast(err instanceof Error ? err.message : "Failed to delete product", "error");
          } finally {
            setDeletingId(null);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
