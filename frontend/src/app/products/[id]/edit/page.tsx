"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { deleteProductImage, getProduct, getProductImages, updateProduct, uploadProductImages } from "@/lib/queries/products";
import type { Product, ProductCreate, ProductImage } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { ProductForm } from "@/components/products/ProductForm";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [product, setProduct] = useState<Product | undefined>();
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileList | null>(null);

  useEffect(() => {
    Promise.all([
      getProduct(Number(id)),
      getProductImages(Number(id)).catch(() => [] as ProductImage[]),
    ])
      .then(([p, imgs]) => {
        setProduct(p);
        setImages(imgs);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFilesSelect = useCallback((files: FileList) => {
    setPendingFiles(files);
  }, []);

  const handleDeleteImage = useCallback(
    async (imageId: number) => {
      await deleteProductImage(Number(id), imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    },
    [id],
  );

  const handleSave = async (data: ProductCreate) => {
    setSaving(true);
    try {
      await updateProduct(Number(id), data);
      if (pendingFiles && pendingFiles.length > 0) {
        await uploadProductImages(Number(id), pendingFiles, images.length === 0);
      }
      await refreshUser();
      router.push(`/products/${id}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!product) return <ErrorMessage message="Product not found" />;

  return (
    <div data-testid="product-edit-page">
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
      <ProductForm initial={product} onSave={handleSave} saving={saving} onFilesSelect={handleFilesSelect} existingImages={images} onDeleteImage={handleDeleteImage} />
    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard roles={["seller", "admin"]}>
      <EditProductPage />
    </AuthGuard>
  );
}
