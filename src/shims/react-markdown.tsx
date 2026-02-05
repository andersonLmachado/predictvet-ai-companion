import React from 'react';

// Shim for react-markdown to provide basic markdown rendering
interface ReactMarkdownProps {
  children?: string;
  remarkPlugins?: any[];
  [key: string]: any;
}

const ReactMarkdown: React.FC<ReactMarkdownProps> = ({ children = '', ...props }) => {
  // Convert markdown to HTML manually for basic cases
  const parseMarkdown = (text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let currentIndex = 0;

    // Split by double newlines for paragraphs
    const paragraphs = text.split('\n\n');

    return paragraphs.map((para, idx) => {
      // Handle bold text
      let content = para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Handle italic text
      content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Handle inline code
      content = content.replace(/`(.*?)`/g, '<code>$1</code>');
      // Handle links
      content = content.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

      return (
        <p key={idx} className="mb-3">
          {React.createElement('span', {
            dangerouslySetInnerHTML: { __html: content }
          })}
        </p>
      );
    });
  };

  return (
    <div className="prose prose-sm max-w-none">
      {parseMarkdown(String(children))}
    </div>
  );
};

export default ReactMarkdown;
