import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./books.css";
export const metadata = { robots: { index: true, follow: true } };
export default function BooksLayout({children}: {children: React.ReactNode}) {return <><a className="book-skip" href="#book-main">Skip to main content</a><SiteHeader/><main id="book-main" tabIndex={-1} className="book-surface">{children}</main><SiteFooter/></>}
