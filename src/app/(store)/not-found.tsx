import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-32 text-center">
      <p className="eyebrow mb-4">404</p>
      <h1 className="heading text-5xl md:text-6xl">This page has drifted away</h1>
      <p className="text-muted mx-auto mt-4 max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          Back home
        </Link>
        <Link href="/shop" className="btn btn-outline">
          Shop perfumes
        </Link>
      </div>
    </div>
  );
}
