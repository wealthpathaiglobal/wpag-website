import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./books.css";
export const metadata = { robots: { index: true, follow: true } };
export default function BooksLayout({children}: {children: React.ReactNode}) {return <><SiteHeader/><main className="book-surface">{children}</main><SiteFooter/></>}
