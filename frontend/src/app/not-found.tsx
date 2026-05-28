import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div data-testid="not-found-page" className="flex flex-col items-center justify-center text-center py-20">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="mt-4 text-xl text-gray-txt">Page not found</p>
      <p className="mt-2 text-sm text-gray-txt">The page you are looking for does not exist or has been moved.</p>
      <Link href="/" className="mt-8">
        <Button>Go Home</Button>
      </Link>
    </div>
  );
}
