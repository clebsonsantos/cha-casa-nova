export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import SetupAlert from "@/components/admin/SetupAlert";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="min-h-screen flex bg-gray-50">
      {session && <AdminSidebar adminName={session.name} />}
      {session && <SetupAlert />}
      <main className={`flex-1 ${session ? "lg:ml-64" : ""}`}>{children}</main>
    </div>
  );
}
