import { desc, eq } from "drizzle-orm";
import { Check, EyeOff, Star, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionButton } from "@/components/admin/crud";
import { Badge, EmptyState, PageHeader, ui } from "@/components/admin/ui";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { deleteReviewAction, setReviewApprovedAction } from "@/lib/actions/admin";
import { adminPage } from "@/lib/admin";
import { getSettings } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  await adminPage();
  const [{ store }, rows] = await Promise.all([
    getSettings(),
    db
      .select({ review: reviews, productName: products.name, productId: products.id })
      .from(reviews)
      .innerJoin(products, eq(products.id, reviews.productId))
      // Reviews waiting for approval come first.
      .orderBy(reviews.approved, desc(reviews.createdAt))
      .limit(200),
  ]);
  const waiting = rows.filter((r) => !r.review.approved).length;

  return (
    <>
      <PageHeader
        title="Reviews"
        description={
          waiting
            ? `${waiting} review${waiting === 1 ? "" : "s"} waiting for approval. Reviews only appear in the store once approved.`
            : "Reviews only appear in the store once approved."
        }
      />
      {rows.length === 0 ? (
        <EmptyState title="No reviews yet" text="Customer reviews submitted on product pages will appear here." />
      ) : (
        <ul className="space-y-3">
          {rows.map(({ review, productName, productId }) => (
            <li key={review.id} className={`${ui.card} p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex gap-0.5" aria-label={`${review.rating} out of 5`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`size-4 ${n <= review.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"}`}
                        />
                      ))}
                    </span>
                    <Badge tone={review.approved ? "green" : "amber"}>
                      {review.approved ? "Published" : "Awaiting approval"}
                    </Badge>
                  </div>
                  {review.title && <p className="mt-2 font-medium text-zinc-900">{review.title}</p>}
                  <p className="mt-1 text-sm whitespace-pre-wrap text-zinc-700">{review.body}</p>
                  <p className="mt-3 text-xs text-zinc-500">
                    {review.name} · {formatDate(review.createdAt, store.locale)} ·{" "}
                    <Link href={`/admin/products/${productId}`} className="hover:underline">
                      {productName}
                    </Link>
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {review.approved ? (
                    <ActionButton action={setReviewApprovedAction.bind(null, review.id, false)}>
                      <EyeOff className="size-4" /> Unpublish
                    </ActionButton>
                  ) : (
                    <ActionButton action={setReviewApprovedAction.bind(null, review.id, true)} className={ui.btn}>
                      <Check className="size-4" /> Approve
                    </ActionButton>
                  )}
                  <ActionButton
                    action={deleteReviewAction.bind(null, review.id)}
                    confirm="Delete this review permanently?"
                    className={ui.btnDanger}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Delete</span>
                  </ActionButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
