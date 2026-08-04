import { Metadata } from "next";
import { SettingsContent } from "@/components/dashboard/settings";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const tab = typeof params?.tab === "string" ? params.tab : "workspace";
  const title = tab.charAt(0).toUpperCase() + tab.slice(1);
  return {
    title: `${title} Settings`,
  };
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const tab = typeof params?.tab === "string" ? params.tab : "workspace";

  return <SettingsContent activeTab={tab} />;
}
