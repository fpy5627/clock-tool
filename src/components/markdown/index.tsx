"use client";

import MDEditor from "@uiw/react-md-editor";
import { Link } from "@/i18n/navigation";
import "./markdown.css";

export default function Markdown({
  content,
}: {
  content: string;
}) {
  return (
    <MDEditor.Markdown
      className="markdown bg-background"
      source={content}
      components={{
        a: ({ children, href, ...props }) => {
          // If it's an internal link (starts with /), use next-intl Link
          if (href && href.startsWith("/")) {
            return (
              <Link href={href as any} {...props}>
                {children}
              </Link>
            );
          }
          // External links open in new tab
          return (
            <a href={href} {...props} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          );
        },
      }}
    />
  );
}
