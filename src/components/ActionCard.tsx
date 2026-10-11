import type { Action } from '../types';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { calculateProgress } from '../lib/timeUtils';
import { Check, Trash2 } from 'lucide-react';

interface ActionCardProps {
  action: Action;
  onComplete: (action: Action) => void;
  onDelete: (action: Action) => void;
}

export function ActionCard({ action, onComplete, onDelete }: ActionCardProps) {
  const targetDate = action.target_dates[action.target_dates.length - 1];
  const now = new Date();
  
  let progress = 0;
  let isOverdue = false;
  
  if (action.status === 'completed' && action.completion_date) {
    // Frozen progress at completion time
    progress = calculateProgress(action.creation_date, targetDate, action.completion_date);
  } else {
    progress = calculateProgress(action.creation_date, targetDate, now);
    isOverdue = targetDate < now;
  }
  
  const previousTargetDate = action.target_dates.length > 1 
    ? action.target_dates[action.target_dates.length - 2] 
    : null;
  
  let previousProgress = 0;
  if (previousTargetDate) {
    previousProgress = calculateProgress(action.creation_date, previousTargetDate, now);
  }
  
  return (
    <Card className={`mb-2 ${isOverdue ? 'border-red-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <p className="font-medium">{action.description}</p>
            {action.labels && action.labels.length > 0 && (
              <div className="flex gap-2 mt-1">
                {action.labels.map((label, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
          {action.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onComplete(action)}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDelete(action)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
          {previousTargetDate && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-yellow-500"
              style={{ left: `${previousProgress}%` }}
            />
          )}
          <div
            className={`h-full transition-all ${
              isOverdue ? 'bg-red-500' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1 text-right">
          {progress.toFixed(0)}%
        </div>
      </CardContent>
    </Card>
  );
}
