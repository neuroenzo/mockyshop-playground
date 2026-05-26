"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProducts } from "@/lib/queries/products";
import type { Product } from "@/types/api";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProducts({ page: 1, size: 8 })
      .then((res) => setProducts(res.items))
      .catch((e) => setError(e.message ?? "Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div data-testid="home-page">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-dark">Welcome to Mock Store</h1>
        <p className="mt-3 text-lg text-gray-txt">Browse products, add to cart, and place orders.</p>
        <div className="mt-6 flex justify-center gap-4">
          <Link href="/products">
            <Button size="lg">Browse Products</Button>
          </Link>
          <Link href="/register">
            <Button variant="secondary" size="lg">Create Account</Button>
          </Link>
        </div>
      </div>

      {loading && <Spinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && products.length === 0 && (
        <p className="text-center text-gray-txt">No products yet.</p>
      )}

      {!loading && products.length > 0 && (
        <>
          <h2 className="text-2xl font-semibold mb-6">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} data-testid={`product-card-${p.id}`}>
                <div className="bg-white rounded-lg shadow-sm border border-gray-line hover:shadow-md transition-shadow">
                  <div className="h-40 bg-gray-lighter rounded-t-lg flex items-center justify-center text-gray-line text-sm">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover rounded-t-lg" />
                    ) : (
                      "No image"
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-dark truncate">{p.name}</h3>
                    <p className="mt-1 text-lg font-bold text-primary">${p.price}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
