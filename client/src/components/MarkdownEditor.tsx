import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Edit, Bold, List, Link } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  title?: string;
  className?: string;
  showPreview?: boolean;
  maxLength?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Enter your content...",
  title,
  className,
  showPreview = true,
  maxLength,
}: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);

  const handlePreview = () => setIsPreview(!isPreview);

  const handleToolbarAction = (action: string) => {
    let newValue = value;
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    switch (action) {
      case 'bold':
        newValue = value.substring(0, start) + `**${selectedText}**` + value.substring(end);
        break;
      case 'list':
        newValue = value.substring(0, start) + `- ${selectedText}` + value.substring(end);
        break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) {
          newValue = value.substring(0, start) + `[${selectedText}](${url})` + value.substring(end);
        }
        break;
    }

    onChange(newValue);
  };

  const renderMarkdown = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        // Headers
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-2xl font-bold mb-2">{line.substring(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-semibold mb-2">{line.substring(3)}</h2>;
        }

        // Bold text
        const boldRegex = /\*\*(.*?)\*\*/g;
        const processedLine = line.replace(boldRegex, '<strong>$1</strong>');

        // Lists
        if (line.startsWith('- ')) {
          return (
            <ul key={index} className="list-disc list-inside mb-2">
              <li dangerouslySetInnerHTML={{ __html: processedLine.substring(2) }} />
            </ul>
          );
        }

        // Links
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const linkProcessed = processedLine.replace(linkRegex, '<a href="$2" class="text-witfy-600 hover:underline">$1</a>');

        return (
          <p key={index} className="mb-2" dangerouslySetInnerHTML={{ __html: linkProcessed }} />
        );
      });
  };

  return (
    <Card className={cn('w-full', className)}>
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}

      <CardContent>
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToolbarAction('bold')}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToolbarAction('list')}
              title="List"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToolbarAction('link')}
              title="Link"
            >
              <Link className="w-4 h-4" />
            </Button>
          </div>

          {showPreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              className="flex items-center gap-2"
            >
              {isPreview ? <Edit className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isPreview ? 'Edit' : 'Preview'}
            </Button>
          )}
        </div>

        {/* Editor/Preview */}
        <div className="min-h-[200px]">
          {isPreview ? (
            <div className="prose prose-sm max-w-none p-3 border rounded-md bg-muted/30">
              {renderMarkdown(value)}
            </div>
          ) : (
            <>
              <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="min-h-[200px] resize-none"
                maxLength={maxLength}
              />
              {maxLength && (
                <div className="text-xs text-muted-foreground mt-1 text-right">
                  {value.length}/{maxLength}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

