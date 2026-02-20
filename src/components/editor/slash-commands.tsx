"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Editor } from "@tiptap/react";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  ImageIcon,
  type LucideIcon,
} from "lucide-react";

export interface SlashCommand {
  title: string;
  description: string;
  icon: LucideIcon;
  command: (editor: Editor) => void;
}

export const slashCommands: SlashCommand[] = [
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: Heading1,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: Heading2,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: Heading3,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: "Bullet List",
    description: "Unordered list of items",
    icon: List,
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: "Numbered List",
    description: "Ordered list of items",
    icon: ListOrdered,
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: "Task List",
    description: "Checklist with checkboxes",
    icon: CheckSquare,
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    title: "Blockquote",
    description: "Highlighted text block",
    icon: Quote,
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: "Code Block",
    description: "Syntax highlighted code",
    icon: Code,
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: "Divider",
    description: "Horizontal rule separator",
    icon: Minus,
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    title: "Image",
    description: "Upload or embed an image",
    icon: ImageIcon,
    command: (editor) => {
      const url = window.prompt("Enter image URL:");
      if (url) editor.chain().focus().setImage({ src: url }).run();
    },
  },
];

const slashPluginKey = new PluginKey("slash-commands");

export function createSlashCommandExtension(
  onOpen: (coords: { top: number; left: number }, query: string) => void,
  onClose: () => void,
  onQueryUpdate: (query: string) => void
) {
  return Extension.create({
    name: "slashCommands",

    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: slashPluginKey,
          state: {
            init() {
              return { active: false, query: "", from: 0 };
            },
            apply(tr, prev) {
              const meta = tr.getMeta(slashPluginKey);
              if (meta) return meta;
              if (prev.active && tr.docChanged) {
                const $pos = tr.selection.$from;
                const textBefore = $pos.parent.textContent.slice(0, $pos.parentOffset);
                const match = textBefore.match(/\/([A-Za-z0-9 ]*)$/);
                if (match) {
                  return { active: true, query: match[1], from: prev.from };
                }
                return { active: false, query: "", from: 0 };
              }
              return prev;
            },
          },
          props: {
            handleKeyDown(view, event) {
              const state = slashPluginKey.getState(view.state);
              if (!state?.active) {
                if (event.key === "/") {
                  // Check if at start of empty block or after space
                  const $pos = view.state.selection.$from;
                  const textBefore = $pos.parent.textContent.slice(0, $pos.parentOffset);
                  if (textBefore.trim() === "") {
                    setTimeout(() => {
                      const coords = view.coordsAtPos(view.state.selection.from);
                      view.dispatch(
                        view.state.tr.setMeta(slashPluginKey, {
                          active: true,
                          query: "",
                          from: view.state.selection.from,
                        })
                      );
                      onOpen(
                        { top: coords.bottom + 4, left: coords.left },
                        ""
                      );
                    }, 0);
                  }
                }
                return false;
              }

              if (event.key === "Escape") {
                view.dispatch(
                  view.state.tr.setMeta(slashPluginKey, {
                    active: false,
                    query: "",
                    from: 0,
                  })
                );
                onClose();
                return true;
              }

              // Pass navigation keys to component
              if (["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
                // These are handled by the popup
                return false;
              }

              // Update query on next tick
              setTimeout(() => {
                const $pos = view.state.selection.$from;
                const textBefore = $pos.parent.textContent.slice(0, $pos.parentOffset);
                const match = textBefore.match(/\/([A-Za-z0-9 ]*)$/);
                if (match) {
                  onQueryUpdate(match[1]);
                  view.dispatch(
                    view.state.tr.setMeta(slashPluginKey, {
                      active: true,
                      query: match[1],
                      from: view.state.selection.from - match[0].length,
                    })
                  );
                } else {
                  view.dispatch(
                    view.state.tr.setMeta(slashPluginKey, {
                      active: false,
                      query: "",
                      from: 0,
                    })
                  );
                  onClose();
                }
              }, 0);

              return false;
            },
          },
        }),
      ];
    },
  });
}

interface SlashMenuProps {
  editor: Editor;
  coords: { top: number; left: number } | null;
  query: string;
  onSelect: (cmd: SlashCommand) => void;
  onClose: () => void;
}

export function SlashMenu({ editor, coords, query, onSelect, onClose }: SlashMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = slashCommands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!coords) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [coords, filtered, selectedIndex, onSelect]);

  if (!coords || filtered.length === 0) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[99] w-64 max-w-[calc(100vw-2rem)] bg-popover border rounded-lg shadow-lg py-1 max-h-72 overflow-y-auto"
      style={{ top: coords.top, left: Math.min(coords.left, window.innerWidth - 272) }}
    >
      {filtered.map((cmd, i) => {
        const Icon = cmd.icon;
        return (
          <button
            key={cmd.title}
            className={`w-full text-left px-3 py-2 flex items-center gap-3 text-sm transition-colors ${
              i === selectedIndex
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50"
            }`}
            onClick={() => onSelect(cmd)}
            onMouseEnter={() => setSelectedIndex(i)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium">{cmd.title}</p>
              <p className="text-xs text-muted-foreground">{cmd.description}</p>
            </div>
          </button>
        );
      })}
    </div>,
    document.body
  );
}
