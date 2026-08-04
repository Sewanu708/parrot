"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { parrotClient } from "@/lib/parrot";
import { useState } from "react";
import { Plus, Edit2, Trash2, Globe, User as UserIcon, Loader2, MessageSquareText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import notify from "@/lib/toast";
import type { CannedResponseDto, CreateCannedResponseDto } from "@parrot/sdk";
import { useSession } from "next-auth/react";

export function CannedResponsesSettings() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  
  const activeTenantId = session?.user?.activeTenantId;
  const activeTenant = session?.user?.tenants?.find((t: any) => t.id === activeTenantId);
  const userRole = activeTenant?.role || "member";
  const canManageShared = ["owner", "admin"].includes(userRole.toLowerCase());

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [shortcut, setShortcut] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"shared" | "personal">("personal");

  const { data: responsesResponse, isLoading } = useQuery({
    queryKey: ["canned-responses"],
    queryFn: () => parrotClient.settings.getCannedResponses(),
  });

  const responses = responsesResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: CreateCannedResponseDto) => parrotClient.settings.createCannedResponse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canned-responses"] });
      notify.success("Canned response created");
      resetForm();
    },
    onError: (err: any) => {
      notify.error(err.response?.data?.message || "Failed to create response");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCannedResponseDto> }) => 
      parrotClient.settings.updateCannedResponse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canned-responses"] });
      notify.success("Canned response updated");
      resetForm();
    },
    onError: (err: any) => {
      notify.error(err.response?.data?.message || "Failed to update response");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => parrotClient.settings.deleteCannedResponse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canned-responses"] });
      notify.success("Canned response deleted");
    },
    onError: (err: any) => {
      notify.error(err.response?.data?.message || "Failed to delete response");
    },
  });

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setShortcut("");
    setContent("");
    setVisibility("personal");
  };

  const handleEdit = (response: CannedResponseDto) => {
    setShortcut(response.shortcut);
    setContent(response.content || "");
    setVisibility(response.visibility);
    setEditingId(response.id);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortcut.trim() || !content.trim()) return;

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: { shortcut, content, visibility }
      });
    } else {
      createMutation.mutate({ shortcut, content, visibility });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {!isFormOpen ? (
        <>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#37352f] dark:text-[#ffffff] mb-2">
                Canned Responses
              </h1>
              <p className="text-sm text-[#37352f]/60 dark:text-[#9b9b9b]">
                Manage quick replies to reuse in conversations. Type '/' in the editor to use them.
              </p>
            </div>
            <Button onClick={() => setIsFormOpen(true)} className="gap-2 shadow-sm cursor-pointer">
              <Plus className="w-4 h-4" />
              New Response
            </Button>
          </div>

          {responses.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 bg-gray-50/50 dark:bg-white/[0.02] border border-dashed border-gray-200 dark:border-white/10 rounded-xl">
              <div className="w-12 h-12 bg-white dark:bg-[#252525] rounded-xl flex items-center justify-center border border-gray-100 dark:border-white/5 mb-4 shadow-sm">
                <MessageSquareText className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">No responses yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[250px] mb-4">
                Create canned responses to answer common questions faster.
              </p>
              <Button variant="outline" size="sm" onClick={() => setIsFormOpen(true)}>
                Create your first response
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {responses.map((response) => (
                <div 
                  key={response.id}
                  className="group bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2d2d2d] rounded-xl p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-400/20 font-mono">
                          /{response.shortcut}
                        </span>
                        {response.visibility === "shared" ? (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400" title="Shared with workspace">
                            <Globe className="w-3 h-3" /> Shared
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400" title="Only visible to you">
                            <UserIcon className="w-3 h-3" /> Personal
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 whitespace-pre-wrap">
                        {response.content}
                      </p>
                      <div className="mt-4 text-xs text-gray-400">
                        Added {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(response.createdAt))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 cursor-pointer"
                        onClick={() => handleEdit(response)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 cursor-pointer"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this response?")) {
                            deleteMutation.mutate(response.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="max-w-2xl">
          <div className="mb-8">
            <button 
              onClick={resetForm}
              className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-4 cursor-pointer"
            >
              &larr; Back to Responses
            </button>
            <h1 className="text-2xl font-bold text-[#37352f] dark:text-[#ffffff]">
              {editingId ? "Edit Response" : "New Canned Response"}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#37352f] dark:text-[#ffffff]">
                Shortcut
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-mono text-lg">/</span>
                <input
                  type="text"
                  value={shortcut}
                  onChange={(e) => setShortcut(e.target.value.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase())}
                  placeholder="hello"
                  className="w-full bg-white dark:bg-[#1e1e1e] border border-[#e9e9e7] dark:border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-[#37352f] dark:text-[#ffffff] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  required
                  maxLength={50}
                />
              </div>
              <p className="text-xs text-gray-500">Only letters, numbers, hyphens, and underscores.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#37352f] dark:text-[#ffffff]">
                Response Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Hi there! How can I help you today?"
                className="w-full bg-white dark:bg-[#1e1e1e] border border-[#e9e9e7] dark:border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-[#37352f] dark:text-[#ffffff] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[150px] resize-y"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-[#37352f] dark:text-[#ffffff]">
                Visibility
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label 
                  className={`
                    relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none 
                    ${visibility === "personal" 
                      ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/10" 
                      : "border-gray-200 dark:border-[#2d2d2d] bg-white dark:bg-[#191919]"}
                  `}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="personal"
                    className="sr-only"
                    checked={visibility === "personal"}
                    onChange={() => setVisibility("personal")}
                  />
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <UserIcon className="w-4 h-4" /> Personal
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 mt-1">
                          Only you can see and use this response.
                        </div>
                      </div>
                    </div>
                    {visibility === "personal" && (
                      <Check className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                    )}
                  </div>
                </label>

                <label 
                  className={`
                    relative flex rounded-lg border p-4 shadow-sm focus:outline-none 
                    ${!canManageShared ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    ${visibility === "shared" 
                      ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/10" 
                      : "border-gray-200 dark:border-[#2d2d2d] bg-white dark:bg-[#191919]"}
                  `}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="shared"
                    className="sr-only"
                    disabled={!canManageShared}
                    checked={visibility === "shared"}
                    onChange={() => setVisibility("shared")}
                  />
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <Globe className="w-4 h-4" /> Shared
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 mt-1">
                          Available to everyone in the workspace.
                          {!canManageShared && " (Requires admin role)"}
                        </div>
                      </div>
                    </div>
                    {visibility === "shared" && (
                      <Check className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-[#e9e9e7] dark:border-[#2d2d2d]">
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                className="cursor-pointer"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingId ? "Save Changes" : "Create Response"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="cursor-pointer">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
