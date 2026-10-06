import Link from "next/link";
import { RenderSections } from "@/components/sections";
import { getPage } from "@/lib/data";

export default async function HomePage() {
  const page = await getPage("home");
  if (!page?.sections.length) {
    return (
      <div className="container-page py-32 text-center">
        <h1 className="heading text-5xl">Welcome</h1>
        <p className="text-muted mt-4">
          The home page has no sections yet. Add some from the admin panel under Pages.
        </p>
        <Link href="/shop" className="btn btn-primary mt-8">
          Browse the shop
        </Link>
      </div>
    );
  }
  return <RenderSections sections={page.sections} />;
}
