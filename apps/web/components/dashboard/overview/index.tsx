import { Header } from "@/components/layout/header";

export function DashboardOverviewPage() {
  const breadcrumbs = [
    { label: "Parrot Main", href: "/overview" },
    { label: "Overview" },
  ];

  return (
    <div className="flex flex-col h-full font-sans transition-colors duration-200">
      <Header breadcrumbs={breadcrumbs} />

      <div className="flex-1 p-8 max-w-5xl mx-auto w-full mt-4">
        <h1 className="text-3xl font-bold text-[#37352f] dark:text-[#ffffff] mb-2">
          Dashboard Overview
        </h1>
        <p className="text-sm text-[#37352f]/60 dark:text-[#9b9b9b] mb-8">
          Welcome to your workspace overview.
        </p>

        <div className="flex-1 flex items-center justify-center min-h-100 text-[#37352f]/40 dark:text-[#555555] text-sm border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
          Dashboard metrics and overview widgets will live here.
        </div>
      </div>
    </div>
  );
}

export default DashboardOverviewPage;
