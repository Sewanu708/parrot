import { Metadata } from "next";
import ContactsPage from "@/components/dashboard/contacts";

export const metadata: Metadata = {
  title: "Contacts",
};

export default function Contacts() {
  return <ContactsPage />;
}
