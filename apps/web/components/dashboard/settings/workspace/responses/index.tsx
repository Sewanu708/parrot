"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus, MessageSquareText, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, ConfirmDeleteModal } from "@/components/parrot-ui";
import notify from "@/lib/toast";
import type { CannedResponseDto } from "@parrot/sdk";
import { ErrorHandler } from "@/lib/utilities";
import {
  useCannedResponses,
  useCreateCannedResponse,
  useUpdateCannedResponse,
  useDeleteCannedResponse,
} from "@/hooks/use-settings";
import type { CannedResponseFormData } from "@/lib/schema";
import { getCannedResponseColumns } from "./column";
import { CannedResponseForm } from "./form";
import { CustomAttributesSheet } from "./ca-sheet";

export function CannedResponsesSettings() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAttributesOpen, setIsAttributesOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<CannedResponseDto | null>(null);
  const [deletingResponseTarget, setDeletingResponseTarget] = useState<CannedResponseDto | null>(null);

  const { data: responsesResponse, isLoading } = useCannedResponses();
  const createMutation = useCreateCannedResponse();
  const updateMutation = useUpdateCannedResponse();
  const deleteMutation = useDeleteCannedResponse();

  const responses = responsesResponse?.data || [];

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingResponse(null);
  };

  const handleEdit = useCallback((response: CannedResponseDto) => {
    setEditingResponse(response);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      const target = responses.find((r) => r.id === id);
      if (target) {
        setDeletingResponseTarget(target);
      }
    },
    [responses],
  );

  const confirmDelete = () => {
    if (!deletingResponseTarget) return;
    deleteMutation.mutate(deletingResponseTarget.id, {
      onSuccess: () => {
        notify.success("Canned response deleted");
        setDeletingResponseTarget(null);
      },
      onError: (err: unknown) => {
        const formattedError = ErrorHandler(err);
        notify.error(err, formattedError);
      },
    });
  };

  const columns = useMemo(
    () => getCannedResponseColumns(handleEdit, handleDelete),
    [handleEdit, handleDelete],
  );

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
        <div className="rounded-xl border border-[#e9e9e7] dark:border-[#2d2d2d] bg-white dark:bg-[#191919] p-4 space-y-3">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
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
                Manage dynamic quick replies for conversations. Use <code>{"{{placeholders}}"}</code> powered by custom attributes for instant personalization, and type <code>/</code> in the composer to use them.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAttributesOpen(true)}
                className="gap-2 cursor-pointer"
              >
                <Tag className="w-4 h-4" />
                Custom Attributes
              </Button>
              <Button
                onClick={() => setIsFormOpen(true)}
                className="gap-2 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Response
              </Button>
            </div>
          </div>

          {responses.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 bg-neutral-50/50 dark:bg-white/2 border border-dashed border-neutral-200 dark:border-white/10 rounded-xl">
              <div className="w-12 h-12 bg-white dark:bg-[#252525] rounded-xl flex items-center justify-center border border-neutral-100 dark:border-white/5 mb-4 shadow-sm">
                <MessageSquareText className="w-6 h-6 text-neutral-400" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                No responses yet
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-62.5 mb-4">
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
            <DataTable columns={columns} data={responses} />
          )}
          
        </>
      ) : (
        <CannedResponseForm
          initialValues={initialValues}
          editingId={editingResponse?.id || null}
          onSubmit={handleSubmit}
          onCancel={resetForm}
          isPending={createMutation.isPending || updateMutation.isPending}
          onOpenAttributesSheet={() => setIsAttributesOpen(true)}
        />
      )}

      <CustomAttributesSheet
        open={isAttributesOpen}
        onOpenChange={setIsAttributesOpen}
      />

      <ConfirmDeleteModal
        open={Boolean(deletingResponseTarget)}
        onOpenChange={(open) => !open && setDeletingResponseTarget(null)}
        title="Delete response"
        description="Are you sure you want to delete this canned response?"
        itemName={deletingResponseTarget ? `/${deletingResponseTarget.shortcut}` : undefined}
        confirmText="Delete"
        onConfirm={confirmDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
