export default function SettingsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto w-full mt-4">
      <h1 className="text-3xl font-bold text-[#37352f] dark:text-[#ffffff] mb-2">
        Workspace Settings
      </h1>
      <p className="text-sm text-[#37352f]/60 dark:text-[#9b9b9b] mb-8">
        Manage your workspace profile and team.
      </p>

      <div className="flex flex-col gap-6">
        {/* We will add Workspace-level settings here later, like Name, Logo, Billing */}
        <div className="bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2d2d2d] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#37352f] dark:text-[#ffffff] mb-4">
            Workspace Profile
          </h2>
          <p className="text-sm text-[#37352f]/60 dark:text-[#9b9b9b]">
            Workspace settings coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
