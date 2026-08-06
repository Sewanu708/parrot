"use client";

export function WorkspaceSettings() {
  return (
    <>
      <h1 className="text-3xl font-bold text-[#37352f] dark:text-[#ffffff] mb-2">
        Workspace Settings
      </h1>
      <p className="text-sm text-[#37352f]/60 dark:text-[#9b9b9b] mb-8">
        Manage your workspace profile and team.
      </p>

      <div className="flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 py-8 border-b border-[#e9e9e7] dark:border-[#2d2d2d] last:border-0">
          <div className="md:col-span-1 space-y-1">
            <h2 className="text-base font-semibold text-[#37352f] dark:text-[#ffffff]">
              Workspace Profile
            </h2>
            <p className="text-sm text-[#37352f]/60 dark:text-[#9b9b9b]">
              Workspace settings coming soon.
            </p>
          </div>
          <div className="md:col-span-2">
            {/* Form will go here */}
          </div>
        </div>
      </div>
    </>
  );
}
