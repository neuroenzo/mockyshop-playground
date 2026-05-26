"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProduct, getProductImages, deleteProduct } from "@/lib/queries/products";
import type { Product, ProductImage } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isRole } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      getProduct(Number(id)),
      getProductImages(Number(id)).catch(() => [] as ProductImage[]),
    ])
      .then(([p, imgs]) => {
        setProduct(p);
        setImages(imgs);
      })
      .catch((e) => setError(e.message ?? "Failed to load product"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Delete this product?")) return;
    setDeleting(true);
    try {
      await deleteProduct(Number(id));
      router.push("/products");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const mainImage = images.find((img) => img.is_main) ?? images[0];

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!product) return <ErrorMessage message="Product not found" />;

  return (
    <div data-testid="product-detail-page">
      <Link href="/products" className="text-sm text-primary hover:text-primary">&larr; Back to products</Link>

      <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-line p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold" data-testid="product-name">{product.name}</h1>
            <p className="text-3xl font-bold text-primary mt-2">${product.price}</p>
          </div>
          <div className="flex gap-2">
            {isRole("seller", "admin") && (
              <>
                <Link href={`/products/${product.id}/edit`}>
                  <Button variant="secondary" testId="btn-edit-product">Edit</Button>
                </Link>
                <Button variant="danger" loading={deleting} onClick={handleDelete} testId="btn-delete-product">Delete</Button>
              </>
            )}
          </div>
        </div>

        {mainImage && (
          <div className="mt-6">
            <img
              src={mainImage.image_url}
              alt={product.name}
              className="w-full max-w-md rounded-lg border border-gray-line object-cover"
              data-testid="product-main-image"
            />
          </div>
        )}

        {images.length > 1 && (
          <div className="mt-4 flex gap-2 flex-wrap">
            {images.map((img) => (
              <img
                key={img.id}
                src={img.image_url}
                alt={product.name}
                className={`w-20 h-20 rounded border object-cover cursor-pointer ${img.is_main ? "ring-2 ring-primary" : "border-gray-line hover:border-primary"}`}
                data-testid={`product-thumb-${img.id}`}
              />
            ))}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-txt">Description</h3>
              <p className="mt-1 text-gray-dark">{product.description ?? "No description"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-txt">Stock</h3>
              <p className="mt-1 text-gray-dark">{product.stock} units</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-txt">Category ID</h3>
              <p className="mt-1 text-gray-dark">{product.category_id}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-txt">Status</h3>
              <Badge variant={product.is_active ? "delivered" : "cancelled"}>
                {product.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-txt">Created</h3>
              <p className="mt-1 text-gray-dark">{new Date(product.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
