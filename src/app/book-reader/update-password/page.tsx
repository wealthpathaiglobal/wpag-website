import { notFound } from "next/navigation";
import { bookReaderFoundationEnabled } from "@/lib/book-reader/config";
import { BookAuthForm } from "@/components/book-reader/auth-form";
export const dynamic = "force-dynamic";
export default function Page() {
  if (!bookReaderFoundationEnabled()) notFound();
  return <BookAuthForm mode="update" />;
}
