import { Header } from "@/components/layout/header";
import { SettingsNav } from "@/components/dashboard/settings/nav";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbs = [
    { label: "Parrot Main", href: "/dashboard" },
    { label: "Settings" },
  ];

  return (
    <div className="flex flex-col h-full font-sans transition-colors duration-200">
      <Header breadcrumbs={breadcrumbs} />

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden border-t border-[#e9e9e7] dark:border-[#2d2d2d] mt-2">
        <SettingsNav />
        <div className="flex-1 overflow-y-auto bg-white dark:bg-[#191919]">
          {children}
        </div>
      </div>
    </div>
  );
}
