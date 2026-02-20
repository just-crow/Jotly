"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  ImageIcon,
  Link as LinkIcon,
  CheckSquare,
  Highlighter,
  Undo,
  Redo,
} from "lucide-react";
import { useCallback, useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  createSlashCommandExtension,
  SlashMenu,
  slashCommands,
  type SlashCommand,
} from "./slash-commands";

const lowlight = createLowlight(common);

interface TipTapEditorProps {
  content: string;
  onChange: (html: string, text: string) => void;
  editable?: boolean;
}

export interface TipTapEditorRef {
  insertAtLine: (line: number, content: string) => void;
  setFileContent: (html: string) => void;
}

function mdToHtml(md: string): string {
  const lines = md.split("\n");
  const result: string[] = [];
  let inCodeBlock = false;
  let codeContent = "";
  let codeLang = "";
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) =>
    s
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>");
  for (const raw of lines) {
    if (raw.startsWith("```")) {
      if (!inCodeBlock) { inCodeBlock = true; codeLang = raw.slice(3).trim() || "text"; codeContent = ""; }
      else { result.push(`<pre><code class="language-${codeLang}">${esc(codeContent.trimEnd())}</code></pre>`); inCodeBlock = false; }
      continue;
    }
    if (inCodeBlock) { codeContent += raw + "\n"; continue; }
    if (/^### /.test(raw)) { result.push(`<h3>${inline(raw.slice(4))}</h3>`); continue; }
    if (/^## /.test(raw)) { result.push(`<h2>${inline(raw.slice(3))}</h2>`); continue; }
    if (/^# /.test(raw)) { result.push(`<h1>${inline(raw.slice(2))}</h1>`); continue; }
    if (/^[-*] /.test(raw)) { result.push(`<ul><li>${inline(raw.slice(2))}</li></ul>`); continue; }
    if (/^\d+\. /.test(raw)) { result.push(`<ol><li>${inline(raw.replace(/^\d+\.\s/, ""))}</li></ol>`); continue; }
    result.push(raw.trim() === "" ? "<p></p>" : `<p>${inline(raw)}</p>`);
  }
  return result.join("");
}

function ToolbarButton({
  onClick,
  isActive,
  icon: Icon,
  label,
}: {
  onClick: () => void;
  isActive?: boolean;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClick}
          className={`h-8 w-8 p-0 ${isActive ? "bg-muted" : ""}`}
          aria-label={label}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

const TipTapEditor = forwardRef<TipTapEditorRef, TipTapEditorProps>(function TipTapEditor(
  { content, onChange, editable = true }: TipTapEditorProps,
  ref
) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Slash command state
  const [slashMenuCoords, setSlashMenuCoords] = useState<{ top: number; left: number } | null>(null);
  const [slashQuery, setSlashQuery] = useState("");

  const handleSlashOpen = useCallback((coords: { top: number; left: number }, query: string) => {
    setSlashMenuCoords(coords);
    setSlashQuery(query);
  }, []);
  const handleSlashClose = useCallback(() => {
    setSlashMenuCoords(null);
    setSlashQuery("");
  }, []);
  const handleSlashQueryUpdate = useCallback((q: string) => {
    setSlashQuery(q);
  }, []);

  const slashExtension = useRef(
    createSlashCommandExtension(handleSlashOpen, handleSlashClose, handleSlashQueryUpdate)
  ).current;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: "Start writing... Use '/' for commands",
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full mx-auto",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4",
        },
      }),
      Highlight.configure({
        HTMLAttributes: {
          class: "bg-yellow-200 dark:bg-yellow-800",
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Underline,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      slashExtension,
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class:
          "prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[300px] sm:min-h-[500px] px-4 py-3 break-words overflow-x-hidden",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      onChange(html, text);
    },
    immediatelyRender: false,
  });

  useImperativeHandle(ref, () => ({
    insertAtLine(line: number, text: string) {
      if (!editor) return;
      const json = editor.getJSON();
      const newNode = { type: "paragraph", content: [{ type: "text", text }] };
      const idx = Math.min(Math.max(line - 1, 0), json.content?.length ?? 0);
      editor.commands.setContent({
        ...json,
        content: [
          ...(json.content?.slice(0, idx) ?? []),
          newNode,
          ...(json.content?.slice(idx) ?? []),
        ],
      });
    },
    setFileContent(html: string) {
      editor?.commands.setContent(html);
    },
  }));

  // Handle image upload
  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("You must be logged in to upload images");
        return;
      }

      const filePath = `${userData.user.id}/${fileName}`;

      const { error } = await supabase.storage
        .from("note-images")
        .upload(filePath, file);

      if (error) {
        toast.error("Failed to upload image");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("note-images").getPublicUrl(filePath);

      editor?.chain().focus().setImage({ src: publicUrl }).run();
      toast.success("Image uploaded!");
    },
    [editor, supabase]
  );

  const addLink = useCallback(() => {
    const previousUrl = editor?.getAttributes("link").href;
    const url = window.prompt("Enter URL", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }, [editor]);

  const handleSlashSelect = useCallback(
    (cmd: SlashCommand) => {
      if (!editor) return;
      // Delete the slash + query text
      const { state } = editor;
      const $pos = state.selection.$from;
      const textBefore = $pos.parent.textContent.slice(0, $pos.parentOffset);
      const match = textBefore.match(/\/([A-Za-z0-9 ]*)$/);
      if (match) {
        const from = $pos.pos - match[0].length;
        editor.chain().focus().deleteRange({ from, to: $pos.pos }).run();
      }
      cmd.command(editor);
      handleSlashClose();
    },
    [editor, handleSlashClose]
  );

  if (!editor) return null;

  return (
    <div className="border rounded-lg overflow-hidden">
      {editable && (
        <div className="border-b bg-muted/30 px-2 py-1 flex items-center gap-0.5 overflow-x-auto scrollbar-thin">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            icon={Bold}
            label="Bold"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            icon={Italic}
            label="Italic"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            icon={UnderlineIcon}
            label="Underline"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            icon={Strikethrough}
            label="Strikethrough"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive("highlight")}
            icon={Highlighter}
            label="Highlight"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive("code")}
            icon={Code}
            label="Inline Code"
          />

          <Separator orientation="vertical" className="h-6 mx-1" />

          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={editor.isActive("heading", { level: 1 })}
            icon={Heading1}
            label="Heading 1"
          />
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={editor.isActive("heading", { level: 2 })}
            icon={Heading2}
            label="Heading 2"
          />
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            isActive={editor.isActive("heading", { level: 3 })}
            icon={Heading3}
            label="Heading 3"
          />

          <Separator orientation="vertical" className="h-6 mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            icon={List}
            label="Bullet List"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            icon={ListOrdered}
            label="Ordered List"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive("taskList")}
            icon={CheckSquare}
            label="Task List"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            icon={Quote}
            label="Blockquote"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive("codeBlock")}
            icon={Code}
            label="Code Block"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            icon={Minus}
            label="Horizontal Rule"
          />

          <Separator orientation="vertical" className="h-6 mx-1" />

          <ToolbarButton onClick={addLink} isActive={editor.isActive("link")} icon={LinkIcon} label="Link" />
          <ToolbarButton
            onClick={() => fileInputRef.current?.click()}
            icon={ImageIcon}
            label="Upload Image"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
              e.target.value = "";
            }}
          />

          <div className="ml-auto flex items-center gap-0.5">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              icon={Undo}
              label="Undo"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              icon={Redo}
              label="Redo"
            />
          </div>
        </div>
      )}

      <EditorContent editor={editor} />
      {slashMenuCoords && (
        <SlashMenu
          editor={editor}
          coords={slashMenuCoords}
          query={slashQuery}
          onSelect={handleSlashSelect}
          onClose={handleSlashClose}
        />
      )}
    </div>
  );
});

export default TipTapEditor;
