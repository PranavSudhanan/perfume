import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./auth";

/**
 * Gate for admin pages. Each page calls this itself (not just the layout),
 * because layouts are not re-rendered on every client-side navigation.
 */
export async function adminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "admin") redirect("/admin/login?denied=1");
  return user;
}
