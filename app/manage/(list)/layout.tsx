import { redirect } from "next/navigation";
import { hasValidTeacherSession } from "@/lib/auth";

// This check has to live in the layout, not just page.tsx: this segment has
// a loading.tsx, which wraps page.tsx in a Suspense boundary. The loading
// fallback (and its 200 status) streams out immediately, before the async
// page component's own redirect() runs — by then the response is already
// committed, so it degrades to a client-side meta-refresh instead of a real
// HTTP redirect. A layout renders outside that Suspense boundary, so its
// redirect() completes before anything is sent.
export default async function ManageListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await hasValidTeacherSession())) {
    redirect("/manage/login");
  }

  return children;
}
