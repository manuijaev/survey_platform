import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

type AdminLoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/admin") ? params.next : "/admin/surveys";
  return <AdminLoginForm nextPath={nextPath} />;
}
