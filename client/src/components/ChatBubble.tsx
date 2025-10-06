import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { User, Bot, Search, RotateCcw, Edit, Check, ArrowRight } from 'lucide-react';

export type ChatBubbleType = 'user' | 'assistant';

export interface ChatBubbleProps {
  type: ChatBubbleType;
  content: string;
  timestamp?: Date;
  actions?: Array<'search' | 'regenerate' | 'edit' | 'approve' | 'next'>;
  onAction?: (action: string) => void;
  className?: string;
}

export function ChatBubble({
  type,
  content,
  timestamp,
  actions = [],
  onAction,
  className,
}: ChatBubbleProps) {
  const isAssistant = type === 'assistant';

  const actionIcons = {
    search: Search,
    regenerate: RotateCcw,
    edit: Edit,
    approve: Check,
    next: ArrowRight,
  };

  return (
    <div className={cn('flex gap-3 mb-4', className)}>
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isAssistant
          ? 'bg-witfy-100 text-witfy-600'
          : 'bg-muted text-muted-foreground'
      )}>
        {isAssistant ? (
          <Bot className="w-4 h-4" />
        ) : (
          <User className="w-4 h-4" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Card className={cn(
          'mb-2',
          isAssistant && 'bg-witfy-50/50 border-witfy-200'
        )}>
          <CardContent className="p-4">
            <div className="prose prose-sm max-w-none">
              {content.split('\n').map((line, index) => (
                <p key={index} className={cn(
                  'mb-2 last:mb-0',
                  line.startsWith('**') && line.endsWith('**') && 'font-semibold text-foreground'
                )}>
                  {line}
                </p>
              ))}
            </div>

            {timestamp && (
              <div className="text-xs text-muted-foreground mt-2">
                {timestamp.toLocaleTimeString()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action buttons */}
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => {
              const Icon = actionIcons[action];
              return (
                <Button
                  key={action}
                  variant="outline"
                  size="sm"
                  onClick={() => onAction?.(action)}
                  className="text-xs"
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

