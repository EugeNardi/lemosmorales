import { authenticated } from "@/lib/crm/auth";
import Inbox from "../crm/page";
import LoginPage from "../crm/login/page";
export default async function ConsultasPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (await authenticated()) ? <Inbox {...props} /> : <LoginPage />;
}
