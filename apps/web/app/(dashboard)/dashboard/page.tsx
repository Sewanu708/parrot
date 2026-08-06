import { Metadata } from "next";
import DashboardOverviewPage from "@/components/dashboard/overview";

export const metadata: Metadata = {
  title: "Dashboard Overview",
};

export default function Dashboard() {
  return <DashboardOverviewPage />;
}
