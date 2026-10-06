import type { Metadata } from "next";
import Link from "next/link";
import { PerfumeBuilder } from "@/components/store/perfume-builder";
import { getBuilderChoices, getSettings } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const { builder } = await getSettings();
  return { title: builder.title || "Create your own perfume", description: builder.subtitle };
}

export default async function CreatePage() {
  const [{ builder }, choices] = await Promise.all([getSettings(), getBuilderChoices()]);

  if (!builder.enabled) {
    return (
      <div className="container-page py-32 text-center">
        <h1 className="heading text-5xl">Bespoke blending is paused</h1>
        <p className="text-muted mx-auto mt-4 max-w-md">
          We are not taking custom perfume orders at the moment. Our signature collection is still
          available.
        </p>
        <Link href="/shop" className="btn btn-primary mt-8">
          Shop the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-12 md:py-16">
      <header className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
        <p className="eyebrow mb-3">Bespoke</p>
        <h1 className="heading text-5xl md:text-6xl">{builder.title}</h1>
        {builder.subtitle && <p className="text-muted mt-4 leading-relaxed">{builder.subtitle}</p>}
      </header>
      <PerfumeBuilder builder={builder} choices={choices} />
    </div>
  );
}
