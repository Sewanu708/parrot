import { Header } from "@/components/layout/header";
import { BrandSettings } from "@/components/dashboard/settings/brand-settings";

export default function SettingsPage() {
  const breadcrumbs = [
    { label: "Parrot Main", href: "/overview" },
    { label: "Settings" },
  ];

  return (
    <div className="flex flex-col h-full font-sans transition-colors duration-200">
      <Header breadcrumbs={breadcrumbs} />

      <div className="flex-1 p-8 max-w-5xl mx-auto w-full mt-4">
        <h1 className="text-3xl font-bold text-[#37352f] dark:text-[#ffffff] mb-2">
          Settings
        </h1>
        <p className="text-sm text-[#37352f]/60 dark:text-[#9b9b9b] mb-8">
          Manage your workspace, team, and widget.
        </p>

        <div className="flex flex-col gap-6">
          <BrandSettings />
        </div>
      </div>
    </div>
  );
}
