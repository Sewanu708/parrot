"use client";

import { useState } from "react";
import { Plus, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import notify from "@/lib/toast";
import type { CannedResponseDto } from "@parrot/sdk";
import { useSession } from "next-auth/react";
import { ErrorHandler } from "@/lib/utilities";
import {
  useCannedResponses,
  useCreateCannedResponse,
  useUpdateCannedResponse,
  useDeleteCannedResponse,
} from "@/hooks/use-settings";
import { CannedResponseCard } from "./canned-response-card";
import { CannedResponseForm } from "./canned-response-form";
import type { CannedResponseFormData } from "@/lib/schema";

export function CannedResponsesSettings() {
  const { data: session } = useSession();

  const activeTenantId = session?.user?.activeTenantId;
  const activeTenant = session?.user?.tenants?.find(
    (t: { id: string; role?: string }) => t.id === activeTenantId,
  );
  const userRole = activeTenant?.role || "member";
  const canManageShared = ["owner", "admin"].includes(userRole.toLowerCase());

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<CannedResponseDto | null>(null);

  const { data: responsesResponse, isLoading } = useCannedResponses();
  const createMutation = useCreateCannedResponse();
  const updateMutation = useUpdateCannedResponse();
  const deleteMutation = useDeleteCannedResponse();

  const responses = responsesResponse?.data || [];

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingResponse(null);
  };

  const handleEdit = (response: CannedResponseDto) => {
    setEditingResponse(response);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this response?")) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          notify.success("Canned response deleted");
        },
        onError: (err: unknown) => {
          const formattedError = ErrorHandler(err);
          notify.error(err, formattedError);
        },
      });
    }
  };

  const handleSubmit = (data: CannedResponseFormData) => {
    if (editingResponse) {
      updateMutation.mutate(
        {
          id: editingResponse.id,
          data,
        },
        {
          onSuccess: () => {
            notify.success("Canned response updated");
            resetForm();
          },
          onError: (err: unknown) => {
            const formattedError = ErrorHandler(err);
            notify.error(err, formattedError);
          },
        },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          notify.success("Canned response created");
          resetForm();
        },
        onError: (err: unknown) => {
          const formattedError = ErrorHandler(err);
          notify.error(err, formattedError);
        },
      });
    }
  };

  const initialValues = editingResponse
    ? {
        shortcut: editingResponse.shortcut,
        content: editingResponse.content || "",
        visibility: editingResponse.visibility,
      }
    : undefined;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2d2d2d] rounded-xl p-5 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-32 mt-2" />
            </div>
          ))}
        </div>
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
                Manage quick replies to reuse in conversations. Type '/' in the
                editor to use them.
              </p>
            </div>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Response
            </Button>
          </div>

          {responses.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 bg-neutral-50/50 dark:bg-white/[0.02] border border-dashed border-neutral-200 dark:border-white/10 rounded-xl">
              <div className="w-12 h-12 bg-white dark:bg-[#252525] rounded-xl flex items-center justify-center border border-neutral-100 dark:border-white/5 mb-4 shadow-sm">
                <MessageSquareText className="w-6 h-6 text-neutral-400" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                No responses yet
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-[250px] mb-4">
                Create canned responses to answer common questions faster.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFormOpen(true)}
              >
                Create your first response
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {responses.map((response) => (
                <CannedResponseCard
                  key={response.id}
                  response={response}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <CannedResponseForm
          initialValues={initialValues}
          canManageShared={canManageShared}
          editingId={editingResponse?.id || null}
          onSubmit={handleSubmit}
          onCancel={resetForm}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
