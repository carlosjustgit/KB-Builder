import { Button } from '@/components/ui/button';
import { Edit, RotateCcw, Save, Loader2 } from 'lucide-react';

interface BottomActionBarProps {
  isEditing: boolean;
  onEdit: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  onRegenerate: () => void;
  isLoading?: boolean;
  isSaving?: boolean;
  editLabel?: string;
  saveLabel?: string;
  cancelLabel?: string;
  regenerateLabel?: string;
  className?: string;
}

/**
 * Bottom action bar component for edit/save/regenerate actions
 * Provides consistent UX across all content pages
 * Scrolls to top when Edit is clicked for better UX
 */
export function BottomActionBar({
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onRegenerate,
  isLoading = false,
  isSaving = false,
  editLabel = 'Edit',
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  regenerateLabel = 'Regenerate',
  className = '',
}: BottomActionBarProps) {
  const handleEdit = () => {
    onEdit();
    // Smooth scroll to top where the editor will appear
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-2 pt-4 mt-4 border-t ${className}`}>
      {isEditing ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                {saveLabel}
              </>
            ) : (
              <>
                <Save className="w-3 h-3 mr-2" />
                {saveLabel}
              </>
            )}
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="w-full sm:w-auto"
          >
            <Edit className="w-3 h-3 mr-2" />
            {editLabel}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="w-3 h-3 mr-2" />
            {regenerateLabel}
          </Button>
        </>
      )}
    </div>
  );
}

