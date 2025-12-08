"use client";

import React from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ForumContentRendererProps {
  content: string;
  className?: string;
}

/**
 * Renders forum content (description or content) properly
 * Handles both Markdown and HTML content
 * Ensures no format elements are visible - only rendered content
 */
export function ForumContentRenderer({ content, className = "" }: ForumContentRendererProps) {
  // Check if content is HTML (starts with <) or Markdown
  const isHTML = content.trim().startsWith('<');
  
  if (isHTML) {
    // Render HTML content without showing tags
    return (
      <div 
        className={`prose max-w-none dark:prose-invert ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  
  // Render Markdown content
  return (
    <div className={`prose max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={atomDark}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

