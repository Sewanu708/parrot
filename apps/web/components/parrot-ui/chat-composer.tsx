"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { useState, useCallback, useEffect, useRef } from "react";
import { Paperclip } from "lucide-react";
import type { CannedResponseDto } from "@parrot/sdk";
import { SlashCommandMenu } from "./slash-command-menu";

interface ChatComposerProps {
  onSend: (text: string) => void;
  isSending?: boolean;
  placeholder?: string;
  cannedResponses: CannedResponseDto[];
}

interface SlashState {
  active: boolean;
  query: string;
  range: { from: number; to: number } | null;
}

export function ChatComposer({
  onSend,
  isSending = false,
  placeholder = "Reply...",
  cannedResponses,
}: ChatComposerProps) {
  const [slashState, setSlashState] = useState<SlashState>({
    active: false,
    query: "",
    range: null,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedIndexRef = useRef(0);
  const slashStateRef = useRef<SlashState | null>(null);

  // Filter canned responses by query
  const filteredItems = cannedResponses.filter((r) =>
    r.shortcut.toLowerCase().includes(slashState.query.toLowerCase()),
  );
  const filteredItemsRef = useRef<CannedResponseDto[]>(filteredItems);

  // Keep refs in sync for use inside closures
  useEffect(() => {
    filteredItemsRef.current = filteredItems;
  }, [filteredItems]);

  useEffect(() => {
    slashStateRef.current = slashState;
  }, [slashState]);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [slashState.query]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Placeholder.configure({ placeholder }),
      Extension.create({
        name: "slashCommand",
        addProseMirrorPlugins() {
          return [
            Suggestion({
              editor: this.editor,
              char: "/",
              startOfLine: false,
              items: ({ query }) => {
                return cannedResponses.filter((r) =>
                  r.shortcut.toLowerCase().includes(query.toLowerCase()),
                );
              },
              render: () => ({
                onStart: (props) => {
                  setSlashState({
                    active: true,
                    query: props.query,
                    range: props.range,
                  });
                },
                onUpdate: (props) => {
                  setSlashState({
                    active: true,
                    query: props.query,
                    range: props.range,
                  });
                },
                onExit: () => {
                  setSlashState({ active: false, query: "", range: null });
                },
                onKeyDown: ({ event }) => {
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setSelectedIndex((prev) => {
                      const next =
                        prev <= 0
                          ? filteredItemsRef.current.length - 1
                          : prev - 1;
                      selectedIndexRef.current = next;
                      return next;
                    });
                    return true;
                  }
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setSelectedIndex((prev) => {
                      const next =
                        prev >= filteredItemsRef.current.length - 1
                          ? 0
                          : prev + 1;
                      selectedIndexRef.current = next;
                      return next;
                    });
                    return true;
                  }
                  if (event.key === "Escape") {
                    setSlashState({ active: false, query: "", range: null });
                    return true;
                  }
                  if (event.key === "Tab") {
                    event.preventDefault();
                    // Tab selects the current item, same as Enter
                    const items = filteredItemsRef.current;
                    const idx = selectedIndexRef.current;
                    const item = items[idx];
                    if (item) {
                      this.editor
                        .chain()
                        .focus()
                        .deleteRange(slashStateRef.current?.range!)
                        .insertContent(item.content || "")
                        .run();
                      setSlashState({ active: false, query: "", range: null });
                    }
                    return true;
                  }
                  return false;
                },
              }),
              command: ({ editor: cmdEditor, range }) => {
                const items = filteredItemsRef.current;
                const idx = selectedIndexRef.current;
                const item = items[idx];
                if (!item) return;

                cmdEditor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .insertContent(item.content || "")
                  .run();
              },
            }),
          ];
        },
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "w-full min-h-[60px] max-h-[200px] overflow-y-auto outline-none text-sm p-2 text-[#37352f] dark:text-[#ffffff] [&_.is-editor-empty:first-child::before]:text-[#37352f]/40 [&_.is-editor-empty:first-child::before]:dark:text-[#777777] [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:pointer-events-none",
      },
    },
    content: "",
    immediatelyRender: false,
  });

  const handleSend = useCallback(() => {
    if (!editor || isSending) return;
    const text = editor.getText().trim();
    if (!text) return;
    onSend(text);
    editor.commands.clearContent();
  }, [editor, isSending, onSend]);

  // Ctrl/Cmd + Enter to send
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        handleSend();
      }
    };

    const editorEl = editor.view.dom;
    editorEl.addEventListener("keydown", handleKeyDown);
    return () => editorEl.removeEventListener("keydown", handleKeyDown);
  }, [editor, handleSend]);

  const handleSelectCannedResponse = useCallback(
    (item: CannedResponseDto) => {
      if (!editor || !slashState.range) return;

      editor
        .chain()
        .focus()
        .deleteRange(slashState.range)
        .insertContent(item.content || "")
        .run();

      setSlashState({ active: false, query: "", range: null });
    },
    [editor, slashState.range],
  );

  return (
    <div className="p-4 bg-white dark:bg-[#191919]">
      <div className="relative border border-[#e9e9e7] dark:border-[#333333] rounded-lg p-2 focus-within:border-[#37352f] dark:focus-within:border-white transition-colors shadow-sm bg-white dark:bg-[#202020]">
        {/* Slash Command Popup */}
        {slashState.active && (
          <SlashCommandMenu
            items={filteredItems}
            selectedIndex={selectedIndex}
            onSelect={handleSelectCannedResponse}
          />
        )}

        {/* Editor */}
        <EditorContent editor={editor} />

        {/* Toolbar */}
        <div className="flex justify-between items-center mt-2 px-2 pb-1">
          <div className="flex items-center gap-2 text-[#37352f]/50 dark:text-[#777777]">
            <Paperclip className="w-4 h-4 cursor-pointer hover:text-[#37352f] dark:hover:text-[#ffffff] transition-colors" />
          </div>
          <button
            onClick={handleSend}
            disabled={isSending}
            className="h-7 px-4 rounded text-xs font-medium bg-[#37352f] dark:bg-white hover:opacity-90 disabled:opacity-50 text-white dark:text-black transition-opacity cursor-pointer outline-none"
          >
            {isSending ? "..." : "Send"}
          </button>
        </div>
      </div>
      <div className="text-center mt-2">
        <span className="text-[10px] text-[#37352f]/40 dark:text-[#555555]">
          Press <kbd className="font-sans font-bold">Ctrl Enter</kbd> to send ·
          Type <kbd className="font-sans font-bold">/</kbd> for quick replies
        </span>
      </div>
    </div>
  );
}
