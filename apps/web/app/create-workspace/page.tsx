import CreateWorkspacePage from "@/components/workspace/create";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Workspace",
};


export default function Workspace() {
  return <CreateWorkspacePage />;
}
