"use client";

import { WorkspaceSettings } from "@/components/dashboard/settings/workspace";
import { PropertiesSettings } from "@/components/dashboard/settings/properties";
import { CannedResponsesSettings } from "@/components/dashboard/settings/workspace/responses";

export function SettingsContent({ activeTab }: { activeTab: string }) {
  return (
    <div className="p-4 max-w-4xl mx-auto w-full mt-4">
      {activeTab === "workspace" && <WorkspaceSettings />}
      {activeTab === "properties" && <PropertiesSettings />}
      {activeTab === "canned_responses" && <CannedResponsesSettings />}
    </div>
  );
}
