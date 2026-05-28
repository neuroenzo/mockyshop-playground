"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProducts } from "@/lib/queries/products";
import type { Product } from "@/types/api";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/Button";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { ProductImagePlaceholder } from "@/components/ui/ProductImagePlaceholder";

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
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary-hover text-white mb-12 px-8 py-12 sm:px-12 sm:py-16">
        <div className="relative z-10">
          <h1 className="text-4xl sm:text-5xl font-bold">Welcome to MockyShop</h1>
          <p className="mt-3 text-lg text-white/80 max-w-xl">
            Browse products, add to cart, and place orders — your one-stop mock shop.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/products">
              <Button size="lg" className="bg-gray-lighter text-primary">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 h-48 w-48 rounded-full bg-white/10 sm:h-64 sm:w-64" />
        <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/10" />
      </div>

      {error && <ErrorMessage message={error} />}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="text-center text-gray-txt">No products yet.</p>
      )}

      {!loading && products.length > 0 && (
        <>
          <h2 className="text-2xl font-semibold mb-6">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} data-testid={`product-card-${p.id}`}>
                <div className="bg-white rounded-lg shadow-sm border border-gray-line hover:shadow-md transition-shadow group h-full">
                  <div className="h-40 bg-gray-lighter rounded-t-lg overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover rounded-t-lg group-hover:scale-105 transition-transform" />
                    ) : (
                      <ProductImagePlaceholder />
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
