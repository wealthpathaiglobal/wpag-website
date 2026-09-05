import {BookSummary} from "@/components/books/book-summary";
export const metadata={title:"Books",description:"Explore HFOS Phase 1: Stability, an educational digital book. Preview the opening chapters. Sales are not open.",alternates:{canonical:"/books"}};
export default function Books(){return <><h1>Books</h1><BookSummary catalogue/></>}
