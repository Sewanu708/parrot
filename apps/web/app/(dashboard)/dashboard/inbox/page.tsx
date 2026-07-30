import InboxPage from "@/components/dashboard/inbox";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Inbox",
};

export default function Inbox() {
  return <InboxPage />;
}
