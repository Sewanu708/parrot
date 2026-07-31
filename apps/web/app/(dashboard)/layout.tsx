import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-white dark:bg-[#191919] text-[#37352f] dark:text-[#ffffff] transition-colors duration-200">
        <Sidebar />
        <main className="flex-1 overflow-y-auto flex flex-col bg-white dark:bg-[#191919]">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
