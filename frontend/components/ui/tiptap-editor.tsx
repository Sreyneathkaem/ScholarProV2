"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import { TextStyle } from "@tiptap/extension-text-style";
import { Node, mergeAttributes } from "@tiptap/core";
import tippy, { type Instance } from "tippy.js";
import "tippy.js/dist/tippy.css";
import type { SuggestionProps } from "@tiptap/suggestion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllVariables } from "@/constants/email-variables";
import type { VariableDefinition } from "@/types/email";
import "./tiptap-editor.css";

// Mention List Component for @ trigger suggestions
const MentionList = ({
  items,
  editor,
}: {
  items: VariableDefinition[];
  editor: Editor;
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      // Delete the @ trigger character and insert variable as atomic node
      editor
        .chain()
        .focus()
        .deleteRange({
          from: editor.state.selection.from - 1,
          to: editor.state.selection.from,
        })
        .insertContent({
          type: "variable",
          attrs: {
            id: item.key,
            label: item.display,
          },
        })
        .insertContent(" ")
        .run();
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + items.length - 1) % items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        upHandler();
        return true;
      }
      if (e.key === "ArrowDown") {
        downHandler();
        return true;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        enterHandler();
        return true;
      }
      return false;
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="mention-popup bg-card z-50 min-w-[18rem] max-w-[22rem] max-h-[320px] overflow-y-auto rounded-xl shadow-xl p-2">
      {items.length ? (
        items.map((item, index) => (
          <button
            key={item.key}
            onClick={() => selectItem(index)}
            className={cn(
              "relative flex w-full cursor-pointer flex-col items-start gap-1 rounded-md px-3 py-2.5 text-sm outline-none select-none transition-all hover:bg-row-hoverblue-50",
              index === selectedIndex && "bg-blue-50",
            )}
          >
            <div className="font-medium text-foreground">{item.display}</div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              {item.description}
            </div>
          </button>
        ))
      ) : (
        <div className="px-3 py-2.5 text-sm text-muted-foreground">
          No variables found
        </div>
      )}
    </div>
  );
};

// Custom Variable Node Extension - makes variables atomic (delete as whole units)
const Variable = Node.create({
  name: "variable",

  group: "inline",

  inline: true,

  atom: true, // Makes it non-editable and atomic

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-id"),
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.id) {
            return {};
          }
          return {
            "data-id": attributes.id,
          };
        },
      },
      label: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-label"),
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.label) {
            return {};
          }
          return {
            "data-label": attributes.label,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="variable"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        {
          "data-type": "variable",
          class: "variable-pill",
        },
        HTMLAttributes,
      ),
      `{{${node.attrs.id}}}`,
    ];
  },

  addKeyboardShortcuts() {
    return {
      // Delete entire variable with backspace
      Backspace: () => {
        const { state } = this.editor;
        const { selection } = state;
        const { $from } = selection;

        // Check if cursor is right after a variable node
        const nodeBefore = $from.nodeBefore;
        if (nodeBefore && nodeBefore.type.name === "variable") {
          return this.editor.commands.command(
            ({
              tr,
            }: {
              tr: { delete: (from: number, to: number) => void };
            }) => {
              const pos = $from.pos - nodeBefore.nodeSize;
              tr.delete(pos, $from.pos);
              return true;
            },
          );
        }

        return false;
      },
      // Delete entire variable with delete key
      Delete: () => {
        const { state } = this.editor;
        const { selection } = state;
        const { $from } = selection;

        // Check if cursor is right before a variable node
        const nodeAfter = $from.nodeAfter;
        if (nodeAfter && nodeAfter.type.name === "variable") {
          return this.editor.commands.command(
            ({
              tr,
            }: {
              tr: { delete: (from: number, to: number) => void };
            }) => {
              const pos = $from.pos;
              tr.delete(pos, pos + nodeAfter.nodeSize);
              return true;
            },
          );
        }

        return false;
      },
    };
  },
});

interface TipTapEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  onInsertVariable?: (key: string) => void;
}

export function TipTapEditor({
  value,
  onChange,
  className,
  onInsertVariable,
}: TipTapEditorProps) {
  // Get all variables (simplified - no category filtering)
  const variables = getAllVariables();

  // Group variables by category for dropdown
  const recipientVars = variables.filter((v) => v.category === "recipient");
  const systemVars = variables.filter((v) => v.category === "system");
  const contextVars = variables.filter((v) => v.category === "context");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing your email message here...",
      }),
      Variable, // Add custom Variable node
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
        },
        suggestion: {
          char: "@",
          items: ({ query }) => {
            const allVars = getAllVariables();
            return allVars
              .filter(
                (v) =>
                  v.key.toLowerCase().includes(query.toLowerCase()) ||
                  v.display.toLowerCase().includes(query.toLowerCase()),
              )
              .slice(0, 10);
          },
          render: () => {
            let component: ReactRenderer | undefined;
            let popup: Instance | undefined;

            return {
              onStart: (props: SuggestionProps) => {
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) {
                  return;
                }

                popup = tippy("body", {
                  getReferenceClientRect: () =>
                    props.clientRect?.() || new DOMRect(),
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                })[0];
              },
              onUpdate(props: SuggestionProps) {
                if (component) {
                  component.updateProps(props);
                }

                if (!props.clientRect || !popup) {
                  return;
                }

                popup.setProps({
                  getReferenceClientRect: () =>
                    props.clientRect?.() || new DOMRect(),
                });
              },
              onKeyDown(props: { event: KeyboardEvent }) {
                if (props.event.key === "Escape") {
                  if (popup) popup.hide();
                  return true;
                }
                return false;
              },
              onExit() {
                if (popup) popup.destroy();
                if (component) component.destroy();
              },
            };
          },
        },
      }),
      TextStyle,
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4 prose-ul:list-disc prose-ol:list-decimal prose-li:my-1",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync editor content when value prop changes from outside
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const handleInsertVariable = (variable: VariableDefinition) => {
    // Insert variable as atomic node
    editor
      .chain()
      .focus()
      .insertContent({
        type: "variable",
        attrs: {
          id: variable.key,
          label: variable.display,
        },
      })
      .insertContent(" ")
      .run();

    // Call parent callback if provided
    if (onInsertVariable) {
      onInsertVariable(variable.key);
    }
  };

  return (
    <div
      className={cn(
        "border border-border rounded-xl overflow-hidden bg-card shadow-sm",
        className,
      )}
    >
      {/* Toolbar */}
      <div className="border-b border-border p-2 bg-card flex items-center gap-1 flex-wrap">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r border-border pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("bold") &&
                "bg-blue-100 text-blue-700 hover:bg-row-hoverblue-200",
            )}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("italic") &&
                "bg-blue-100 text-blue-700 hover:bg-row-hoverblue-200",
            )}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("underline") &&
                "bg-blue-100 text-blue-700 hover:bg-row-hoverblue-200",
            )}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r border-border pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("bulletList") &&
                "bg-blue-100 text-blue-700 hover:bg-row-hoverblue-200",
            )}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("orderedList") &&
                "bg-blue-100 text-blue-700 hover:bg-row-hoverblue-200",
            )}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 border-r border-border pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive({ textAlign: "left" }) &&
                "bg-blue-100 text-blue-700 hover:bg-row-hoverblue-200",
            )}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive({ textAlign: "center" }) &&
                "bg-blue-100 text-blue-700 hover:bg-row-hoverblue-200",
            )}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive({ textAlign: "right" }) &&
                "bg-blue-100 text-blue-700 hover:bg-row-hoverblue-200",
            )}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Links */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={setLink}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("link") &&
                "bg-blue-100 text-blue-700 hover:bg-row-hoverblue-200",
            )}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Variables Dropdown */}
        {variables.length > 0 && (
          <div className="flex items-center gap-1 border-l border-border pl-2 ml-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 gap-1"
                >
                  Variables
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {recipientVars.length > 0 && (
                  <>
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                      Recipient
                    </DropdownMenuLabel>
                    {recipientVars.map((variable) => (
                      <DropdownMenuItem
                        key={variable.key}
                        onClick={() => handleInsertVariable(variable)}
                        className="flex flex-col items-start gap-1 py-2.5 px-3 cursor-pointer hover:bg-row-hoverblue-50 focus:bg-row-hoverblue-50"
                      >
                        <div className="font-medium text-foreground text-sm">
                          {variable.display}
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed">
                          {variable.description}
                        </div>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}

                {systemVars.length > 0 && (
                  <>
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                      System
                    </DropdownMenuLabel>
                    {systemVars.map((variable) => (
                      <DropdownMenuItem
                        key={variable.key}
                        onClick={() => handleInsertVariable(variable)}
                        className="flex flex-col items-start gap-1 py-2.5 px-3 cursor-pointer hover:bg-row-hoverblue-50 focus:bg-row-hoverblue-50"
                      >
                        <div className="font-medium text-foreground text-sm">
                          {variable.display}
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed">
                          {variable.description}
                        </div>
                      </DropdownMenuItem>
                    ))}
                    {contextVars.length > 0 && <DropdownMenuSeparator />}
                  </>
                )}

                {contextVars.length > 0 && (
                  <>
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                      Context
                    </DropdownMenuLabel>
                    {contextVars.map((variable) => (
                      <DropdownMenuItem
                        key={variable.key}
                        onClick={() => handleInsertVariable(variable)}
                        className="flex flex-col items-start gap-1 py-2.5 px-3 cursor-pointer hover:bg-row-hoverblue-50 focus:bg-row-hoverblue-50"
                      >
                        <div className="font-medium text-foreground text-sm">
                          {variable.display}
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed">
                          {variable.description}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} className="tiptap-editor-content" />
    </div>
  );
}
