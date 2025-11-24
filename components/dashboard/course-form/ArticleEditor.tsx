"use client";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    List,
    ListOrdered,
    Quote,
    Code,
    Link as LinkIcon,
    Image as ImageIcon,
    Undo,
    Redo,
    AlignLeft,
    AlignCenter,
    AlignRight,
} from "lucide-react";
import { cn } from "@/utils/utils";

interface ArticleEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

/**
 * Rich text editor for Article content type using TipTap
 * Full-featured WYSIWYG editor with formatting toolbar
 */
export function ArticleEditor({
    value,
    onChange,
    placeholder = "Start writing your article...",
    className = "",
}: ArticleEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4, 5, 6],
                },
                // Disable link extension in StarterKit since we're adding it separately with custom config
                link: false,
            }),
            Placeholder.configure({
                placeholder,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-primary underline",
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: "max-w-full h-auto rounded-lg",
                },
            }),
            TextStyle,
            Color,
        ],
        content: value || "",
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[500px] p-4",
            },
        },
        immediatelyRender: false,
    });

    if (!editor) {
        return null;
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("URL", previousUrl);

        if (url === null) {
            return;
        }

        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    };

    const addImage = () => {
        const url = window.prompt("Image URL");
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    return (
        <div className={cn("space-y-2 w-full", className)}>
            <Label className="text-sm font-semibold">Article Content *</Label>
            <div className="rounded-xl border border-border/40 bg-card/50 overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border/40 bg-muted/30">
                    <div className="flex items-center gap-1 border-r border-border/40 pr-2 mr-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn("h-8 w-8 p-0", editor.isActive("bold") && "bg-primary/20 text-primary")}
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            disabled={!editor.can().chain().focus().toggleBold().run()}
                        >
                            <Bold className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn("h-8 w-8 p-0", editor.isActive("italic") && "bg-primary/20 text-primary")}
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            disabled={!editor.can().chain().focus().toggleItalic().run()}
                        >
                            <Italic className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn("h-8 w-8 p-0", editor.isActive("strike") && "bg-primary/20 text-primary")}
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            disabled={!editor.can().chain().focus().toggleStrike().run()}
                        >
                            <Strikethrough className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-1 border-r border-border/40 pr-2 mr-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 1 }) && "bg-primary/20 text-primary")}
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        >
                            H1
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 2 }) && "bg-primary/20 text-primary")}
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        >
                            H2
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 3 }) && "bg-primary/20 text-primary")}
                            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        >
                            H3
                        </Button>
                    </div>

                    <div className="flex items-center gap-1 border-r border-border/40 pr-2 mr-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn("h-8 w-8 p-0", editor.isActive("bulletList") && "bg-primary/20 text-primary")}
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn("h-8 w-8 p-0", editor.isActive("orderedList") && "bg-primary/20 text-primary")}
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        >
                            <ListOrdered className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn("h-8 w-8 p-0", editor.isActive("blockquote") && "bg-primary/20 text-primary")}
                            onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        >
                            <Quote className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn("h-8 w-8 p-0", editor.isActive("codeBlock") && "bg-primary/20 text-primary")}
                            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        >
                            <Code className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-1 border-r border-border/40 pr-2 mr-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn("h-8 w-8 p-0", editor.isActive("link") && "bg-primary/20 text-primary")}
                            onClick={setLink}
                        >
                            <LinkIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={addImage}
                        >
                            <ImageIcon className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => editor.chain().focus().undo().run()}
                            disabled={!editor.can().chain().focus().undo().run()}
                        >
                            <Undo className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => editor.chain().focus().redo().run()}
                            disabled={!editor.can().chain().focus().redo().run()}
                        >
                            <Redo className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Editor Content */}
                <div className="min-h-[500px] max-h-[800px] overflow-y-auto">
                    <EditorContent editor={editor} />
                </div>
            </div>
            <p className="text-xs text-muted-foreground">
                Use the toolbar above to format your article. Supports headings, lists, links, images, and more.
            </p>
        </div>
    );
}
