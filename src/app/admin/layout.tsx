export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Allow login page without check
  const session = await getSession();

  return (
    <div className="min-h-screen flex bg-gray-50">
      {session && <AdminSidebar adminName={session.name} />}
      <main className={`flex-1 ${session ? "lg:ml-64" : ""}`}>{children}</main>
    </div>
  );
}
