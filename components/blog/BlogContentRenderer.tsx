"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

interface BlogContentRendererProps {
  content: string;
  className?: string;
}

/**
 * Renders blog content with proper styling for:
 * - HTML content
 * - Markdown content
 * - Code blocks with syntax highlighting
 * - Inline code
 * - Lists, headings, links, images, etc.
 */
export function BlogContentRenderer({ content, className = "" }: BlogContentRendererProps) {
  // Check if content is HTML or markdown
  const isHTML = content.includes("<") && (content.includes("</") || content.includes("/>"));
  
  // Normalize <br> tags and fix common HTML issues
  const normalizeContent = (html: string): string => {
    return html
      // Fix incorrect </br> tags to <br/>
      .replace(/<\/br>/gi, '<br/>')
      // Normalize <br> to <br/>
      .replace(/<br>/gi, '<br/>')
      // Ensure multiple line breaks create spacing
      .replace(/(<br\s*\/?>)\s*(<br\s*\/?>)/gi, '<br/><br/>');
  };
  
  // If it's HTML, render it directly with proper styling
  if (isHTML) {
    const normalizedContent = normalizeContent(content);
    
    return (
      <div className={`prose prose-lg dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-base prose-headings:font-bold prose-p:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline ${className}`}>
        <div
          dangerouslySetInnerHTML={{ __html: normalizedContent }}
          className="blog-content-html"
        />
        <style jsx global>{`
          .blog-content-html pre {
            background: rgb(17, 24, 39) !important;
            color: rgb(229, 231, 235) !important;
            padding: 1rem !important;
            border-radius: 0.5rem !important;
            overflow-x: auto !important;
            margin: 1rem 0 !important;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
          }
          .blog-content-html code {
            background: rgb(243, 244, 246) !important;
            color: rgb(59, 130, 246) !important;
            padding: 0.125rem 0.375rem !important;
            border-radius: 0.25rem !important;
            font-size: 0.875em !important;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
          }
          .blog-content-html pre code {
            background: transparent !important;
            color: inherit !important;
            padding: 0 !important;
            border-radius: 0 !important;
            font-size: inherit !important;
          }
          .blog-content-html {
            line-height: 1.75 !important;
          }
          .blog-content-html p {
            margin: 1.5em 0 !important;
            line-height: 1.75 !important;
          }
          .blog-content-html p:first-child {
            margin-top: 0 !important;
          }
          .blog-content-html p:last-child {
            margin-bottom: 0 !important;
          }
          .blog-content-html p + p {
            margin-top: 1.5em !important;
          }
          .blog-content-html br {
            line-height: 1.5 !important;
          }
          .blog-content-html br + br {
            margin-top: 0.75em !important;
            display: block !important;
            content: "" !important;
          }
          .dark .blog-content-html code {
            background: rgb(31, 41, 55) !important;
            color: rgb(147, 197, 253) !important;
          }
          .dark .blog-content-html pre {
            background: rgb(17, 24, 39) !important;
            color: rgb(229, 231, 235) !important;
          }
        `}</style>
      </div>
    );
  }

  // If it's markdown or plain text, use ReactMarkdown
  return (
    <div className={`prose prose-lg dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-base prose-headings:font-bold prose-p:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code block with syntax highlighting
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (!inline && language) {
              return (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={language}
                  PreTag="div"
                  className="rounded-lg !mt-4 !mb-4"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            }
            
            // Inline code
            return (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },
          // Headings
          h1: ({ children }) => <h1 className="text-4xl font-bold mt-8 mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-3xl font-bold mt-6 mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-2xl font-semibold mt-4 mb-2">{children}</h3>,
          // Links
          a: ({ href, children }) => (
            <a href={href} className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          // Images
          img: ({ src, alt }) => (
            <img src={src} alt={alt} className="rounded-lg my-4 max-w-full h-auto" />
          ),
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
              {children}
            </blockquote>
          ),
          // Lists
          ul: ({ children }) => <ul className="list-disc list-inside my-4 space-y-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside my-4 space-y-2">{children}</ol>,
          // Paragraphs
          p: ({ children }) => <p className="my-4 leading-relaxed">{children}</p>,
          // Line breaks
          br: () => <br className="block my-2" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

