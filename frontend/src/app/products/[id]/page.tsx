"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProduct, getProductImages, deleteProduct } from "@/lib/queries/products";
import { getCart, addCartItem, updateCartItem, removeCartItem } from "@/lib/queries/cart";
import type { Product, ProductImage } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ProductDetailSkeleton } from "@/components/ui/Skeleton";
import { ProductImagePlaceholder } from "@/components/ui/ProductImagePlaceholder";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isRole } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartQty, setCartQty] = useState(0);
  const [cartItemId, setCartItemId] = useState<number | null>(null);
  const [cartMsg, setCartMsg] = useState<string | null>(null);
  const [cartMsgType, setCartMsgType] = useState<"success" | "error">("success");

  useEffect(() => {
    Promise.all([
      getProduct(Number(id)),
      getProductImages(Number(id)).catch(() => [] as ProductImage[]),
      getCart().catch(() => null),
    ])
      .then(([p, imgs, cart]) => {
        setProduct(p);
        setImages(imgs);
        if (cart) {
          const item = cart.items.find((i) => i.product_id === Number(id));
          setCartQty(item?.quantity ?? 0);
          setCartItemId(item?.id ?? null);
        }
      })
      .catch((e) => setError(e.message ?? "Failed to load product"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProduct(Number(id));
      toast("Product deleted", "success");
      router.push("/products");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed to delete", "error");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const showCartMsg = (msg: string, type: "success" | "error") => {
    setCartMsg(msg);
    setCartMsgType(type);
    setTimeout(() => setCartMsg(null), 1500);
  };

  const handleAddToCart = async () => {
    setAddingToCart(true);
    setCartMsg(null);
    try {
      await addCartItem({ product_id: Number(id), quantity });
      const cart = await getCart();
      const item = cart.items.find((i) => i.product_id === Number(id));
      setCartQty(item?.quantity ?? 0);
      setCartItemId(item?.id ?? null);
      showCartMsg("Added to cart", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("stock")) {
        showCartMsg("Not enough stock available", "error");
      } else {
        showCartMsg("Failed to add to cart", "error");
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleIncrement = async () => {
    if (product && cartQty >= product.stock) {
      showCartMsg("Maximum quantity reached", "error");
      return;
    }
    try {
      await addCartItem({ product_id: Number(id), quantity: 1 });
      const cart = await getCart();
      const item = cart.items.find((i) => i.product_id === Number(id));
      setCartQty(item?.quantity ?? 0);
      setCartItemId(item?.id ?? null);
      if (product && (item?.quantity ?? 0) >= product.stock) {
        showCartMsg("Maximum quantity reached", "error");
      }
    } catch { /* ignore */ }
  };

  const handleDecrement = async () => {
    if (cartQty <= 1 && cartItemId) {
      try {
        await removeCartItem(cartItemId);
        setCartQty(0);
        setCartItemId(null);
      } catch { /* ignore */ }
    } else if (cartItemId) {
      try {
        await updateCartItem(cartItemId, { product_id: Number(id), quantity: cartQty - 1 });
        setCartQty((prev) => prev - 1);
      } catch { /* ignore */ }
    }
  };

  const mainImage = images.find((img) => img.is_main) ?? images[0];

  if (loading) return <ProductDetailSkeleton />;
  if (error) return <ErrorMessage message={error} />;
  if (!product) return <ErrorMessage message="Product not found" />;

  return (
    <div data-testid="product-detail-page">
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: "Products", href: "/products" },
        { label: product.name },
      ]} />

      <div className="bg-white rounded-lg shadow-sm border border-gray-line p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="product-name">{product.name}</h1>
            <p className="text-3xl font-bold text-primary mt-2">${product.price}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {isRole("seller", "admin") && (
              <>
                <Link href={`/products/${product.id}/edit`}>
                  <Button variant="secondary" testId="btn-edit-product">Edit</Button>
                </Link>
                <Button variant="danger" onClick={() => setShowDeleteModal(true)} testId="btn-delete-product">Delete</Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-6">
          {mainImage ? (
            <img
              src={mainImage.image_url}
              alt={product.name}
              className="w-72 max-w-full rounded-lg border border-gray-line object-cover"
              data-testid="product-main-image"
            />
          ) : (
            <div className="w-72 max-w-full h-48 rounded-lg border border-gray-line overflow-hidden">
              <ProductImagePlaceholder />
            </div>
          )}
        </div>

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
            {isRole("buyer") && (
              <div className="pt-2 border-t border-gray-line">
                <h3 className="text-sm font-medium text-gray-txt mb-2">Your Cart</h3>
                {product.stock < 1 ? (
                  <p className="text-sm text-red-600">Out of stock</p>
                ) : (
                  <>
                    <div className="min-h-[36px] mb-3">
                      {cartQty > 0 ? (
                        <div className="flex items-center gap-2" data-testid="cart-qty-indicator">
                          <button
                            onClick={handleDecrement}
                            disabled={cartQty <= 0}
                            className="w-8 h-8 rounded border border-gray-line text-gray-dark hover:bg-gray-lighter disabled:opacity-30 disabled:cursor-not-allowed text-lg leading-none"
                            data-testid="btn-decrement"
                          >
                            −
                          </button>
                          <span className="w-10 text-center text-sm font-semibold" data-testid="cart-qty-value">
                            {cartQty}
                          </span>
                          <button
                            onClick={handleIncrement}
                            disabled={cartQty >= (product?.stock ?? 0)}
                            className="w-8 h-8 rounded border border-gray-line text-gray-dark hover:bg-gray-lighter disabled:opacity-30 disabled:cursor-not-allowed text-lg leading-none"
                            data-testid="btn-increment"
                          >
                            +
                          </button>
                          <span className="text-xs text-gray-txt ml-1">in cart</span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-txt">Not in your cart yet</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={product.stock}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.min(Math.max(1, Number(e.target.value)), product.stock))}
                        className="w-20 rounded border border-gray-line px-3 py-2 text-sm text-center"
                        data-testid="input-cart-quantity"
                      />
                      <Button onClick={handleAddToCart} loading={addingToCart} testId="btn-add-to-cart">
                        Add to Cart
                      </Button>
                    </div>

                    {cartMsg && (
                      <p className={`mt-2 text-sm ${cartMsgType === "success" ? "text-green-600" : "text-red-600"}`} data-testid="cart-msg">
                        {cartMsg}
                      </p>
                    )}

                    <div className="min-h-[24px] mt-3">
                      {cartQty > 0 && (
                        <Link
                          href="/cart"
                          className="inline-block text-sm font-medium text-primary hover:text-primary underline"
                          data-testid="link-view-cart"
                        >
                          View Cart &rarr;
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-txt">Category ID</h3>
              <p className="mt-1 text-gray-dark">{product.category_id}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-txt">Status</h3>
              <Badge variant={product.is_active ? "active" : "inactive"}>
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

      <ConfirmationModal
        open={showDeleteModal}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
