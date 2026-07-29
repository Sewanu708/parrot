import { Header } from "@/components/layout/header";
import { ParrotEmptyIcon } from "@/components/icons";

export default function OverviewPage() {
  const breadcrumbs = [
    { label: "Parrot Main" },
    { label: "Overview" },
  ];

  return (
    <div className="flex flex-col h-full font-sans transition-colors duration-200">
      <Header breadcrumbs={breadcrumbs} />

      <div className="flex-1 p-8 max-w-5xl mx-auto w-full mt-4">
        <h1 className="text-3xl font-bold text-[#37352f] dark:text-[#ffffff] mb-2">
          Overview
        </h1>
        <p className="text-sm text-[#37352f]/60 dark:text-[#9b9b9b] mb-8">
          Your workspace at a glance.
        </p>

        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-[#37352f]/40 dark:text-[#555555] text-sm">
          <ParrotEmptyIcon className="w-16 h-16 mb-4 opacity-50" />
          <p>Analytics and metrics will live here.</p>
        </div>
      </div>
    </div>
  );
}
