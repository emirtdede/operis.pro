import { PageLoader } from "./page-loader";

export interface DashboardSkeletonProps {
  cardsCount?: number;
}

export function DashboardSkeleton(_props: DashboardSkeletonProps) {
  return <PageLoader />;
}
