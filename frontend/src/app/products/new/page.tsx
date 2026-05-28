"use client";

import { useRouter } from "next/navigation";
import { createProduct, uploadProductImages } from "@/lib/queries/products";
import type { ProductCreate } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { ProductForm } from "@/components/products/ProductForm";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useState, useCallback } from "react";

function NewProductPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileList | null>(null);

  const handleFilesSelect = useCallback((files: FileList) => {
    setPendingFiles(files);
  }, []);

  const handleSave = async (data: ProductCreate) => {
    setSaving(true);
    try {
      const product = await createProduct(data);
      if (pendingFiles && pendingFiles.length > 0) {
        await uploadProductImages(product.id, pendingFiles, true);
      }
      await refreshUser();
      router.push(`/products/${product.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="product-new-page">
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: "Products", href: "/products" },
        { label: "New Product" },
      ]} />
      <h1 className="text-2xl font-bold mb-6">New Product</h1>
      <ProductForm onSave={handleSave} saving={saving} onFilesSelect={handleFilesSelect} />
    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard roles={["seller", "admin"]}>
      <NewProductPage />
    </AuthGuard>
  );
}
