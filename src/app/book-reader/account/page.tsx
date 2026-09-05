import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { bookReaderFoundationEnabled } from "@/lib/book-reader/config";
import { BookReaderError, requireBookIdentity } from "@/lib/book-reader/server";
import { ProfileBootstrap } from "@/components/book-reader/profile-bootstrap";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!bookReaderFoundationEnabled()) notFound();
  let identity;
  try { identity = await requireBookIdentity(); }
  catch (error) {
    if (error instanceof BookReaderError && error.status === 401) redirect("/book-reader/login");
    throw error;
  }
  const { data, error } = await identity.client.from("book_reader_profiles").select("user_id,created_at").eq("user_id", identity.userId).maybeSingle();
  return <main className="mx-auto min-h-screen max-w-xl px-6 py-16">
    <h1 className="text-3xl font-semibold">Book reader account</h1>
    <p className="my-4">This account is for book access. Setting up a book reader profile does not enroll you in research or change existing participant access.</p>
    {error ? <p role="alert">Book reader accounts are temporarily unavailable.</p> : <ProfileBootstrap exists={Boolean(data)} />}
    <p>The free preview remains available without an account.</p>
    <Link className="mt-4 inline-block underline" href="/books">Explore the book</Link>
  </main>;
}
