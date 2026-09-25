import { notFound } from "next/navigation";
import ListingsLoading from "../listings/loading";

export default function TestSkeletonPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <ListingsLoading />;
}
