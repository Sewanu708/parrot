import { Metadata } from "next";
import AutomationsPage from "@/components/dashboard/automations";

export const metadata: Metadata = {
  title: "Automations",
};

export default function Automations() {
  return <AutomationsPage />;
}
