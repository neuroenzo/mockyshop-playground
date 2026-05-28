"use client";

import { useEffect, useRef, useState } from "react";
import { getCategories } from "@/lib/queries/categories";
import type { Category, Product, ProductCreate, ProductImage } from "@/types/api";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

interface Props {
  initial?: Product;
  onSave: (data: ProductCreate) => Promise<void>;
  saving: boolean;
  onFilesSelect?: (files: FileList) => void;
  existingImages?: ProductImage[];
  onDeleteImage?: (imageId: number) => void;
}

export function ProductForm({ initial, onSave, saving, onFilesSelect, existingImages, onDeleteImage }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [stock, setStock] = useState(initial?.stock?.toString() ?? "0");
  const [categoryId, setCategoryId] = useState(initial?.category_id?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleFileChange = () => {
    const files = fileRef.current?.files;
    if (files && files.length > 0) {
      const previews: string[] = [];
      Array.from(files).forEach((f) => {
        previews.push(URL.createObjectURL(f));
      });
      setFilePreviews(previews);
      onFilesSelect?.(files);
    }
  };

  useEffect(() => {
    return () => {
      filePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [filePreviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !price || !categoryId) {
      setError("Name, price, and category are required.");
      return;
    }
    try {
      await onSave({
        name,
        description: description || null,
        price,
        stock: Number(stock),
        category_id: Number(categoryId),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-line p-6 space-y-4 max-w-lg">
      {error && <ErrorMessage message={error} />}
      <Input label="Name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
      <div className="space-y-1">
        <label htmlFor="description" className="block text-sm font-medium text-gray-txt">Description</label>
        <textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="block w-full rounded-md border border-gray-line px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          data-testid="input-description"
        />
      </div>
      <Input label="Price" name="price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
      <Input label="Stock" name="stock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} required />
      <Select
        label="Category"
        name="category_id"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
        placeholder="Select category"
      />
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-txt">Images</label>
        {existingImages && existingImages.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2">
            {existingImages.map((img) => (
              <div key={img.id} className="relative">
                <img
                  src={img.image_url}
                  alt={img.original_filename ?? ""}
                  className="w-16 h-16 rounded border border-gray-line object-cover"
                  data-testid={`existing-image-${img.id}`}
                />
                {onDeleteImage && (
                  <button
                    type="button"
                    onClick={() => onDeleteImage(img.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:scale-110 transition-transform"
                    data-testid={`btn-delete-image-${img.id}`}
                    aria-label={`Delete ${img.original_filename ?? "image"}`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <input
          ref={fileRef}
          id="images"
          name="images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-txt file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-light file:text-primary hover:file:bg-[#ffd6e0]"
          data-testid="input-product-images"
        />
        {filePreviews.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-2">
            {filePreviews.map((url, idx) => (
              <div key={idx} className="relative">
                <img
                  src={url}
                  alt={`Preview ${idx + 1}`}
                  className="w-16 h-16 rounded border border-gray-line object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFilePreviews((prev) => prev.filter((_, i) => i !== idx));
                    const dt = new DataTransfer();
                    const files = fileRef.current?.files;
                    if (files) {
                      Array.from(files).forEach((f, i) => {
                        if (i !== idx) dt.items.add(f);
                      });
                      if (fileRef.current) fileRef.current.files = dt.files;
                    }
                  }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:scale-110 transition-transform"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <Button type="submit" loading={saving} testId="btn-product-save">
        {initial ? "Update Product" : "Create Product"}
      </Button>
    </form>
  );
}
