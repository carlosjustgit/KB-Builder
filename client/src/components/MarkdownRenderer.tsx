import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const renderMarkdown = (text: string) => {
    // Clean up any reasoning tags or artifacts
    let cleanedText = text
      .replace(/<think>[\s\S]*?<\/think>/gi, '') // Remove <think> tags
      .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '') // Remove <reasoning> tags
      .replace(/<analysis>[\s\S]*?<\/analysis>/gi, '') // Remove <analysis> tags
      .replace(/<thought>[\s\S]*?<\/thought>/gi, '') // Remove <thought> tags
      .replace(/Let me carefully analyze[\s\S]*?\./gi, '') // Remove analysis statements
      .replace(/I need to[\s\S]*?\./gi, '') // Remove "I need to" statements
      .replace(/First, let me[\s\S]*?\./gi, '') // Remove "First, let me" statements
      .trim();

    return cleanedText
      .split('\n')
      .map((line, index) => {
        // Skip empty lines
        if (!line.trim()) {
          return <br key={index} />;
        }

        // Headers
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-2xl font-bold mb-4 mt-6">{line.substring(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-semibold mb-3 mt-5">{line.substring(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-medium mb-2 mt-4">{line.substring(4)}</h3>;
        }

        // Bold text
        const boldRegex = /\*\*(.*?)\*\*/g;
        const processedLine = line.replace(boldRegex, '<strong>$1</strong>');

        // Lists
        if (line.startsWith('- ')) {
          return (
            <ul key={index} className="list-disc list-inside mb-2 ml-4">
              <li dangerouslySetInnerHTML={{ __html: processedLine.substring(2) }} />
            </ul>
          );
        }

        // Numbered lists
        if (/^\d+\.\s/.test(line)) {
          return (
            <ol key={index} className="list-decimal list-inside mb-2 ml-4">
              <li dangerouslySetInnerHTML={{ __html: processedLine.replace(/^\d+\.\s/, '') }} />
            </ol>
          );
        }

        // Links
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const linkProcessed = processedLine.replace(linkRegex, '<a href="$2" class="text-witfy-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

        // Regular paragraphs
        return (
          <p key={index} className="mb-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: linkProcessed }} />
        );
      });
  };

  return (
    <div className={`prose prose-sm max-w-none ${className || ''}`}>
      {renderMarkdown(content)}
    </div>
  );
}
