import type { Action } from '../types';
import { ActionCard } from './ActionCard';

interface PrioritySectionProps {
  name: string;
  actions: Action[];
  onComplete: (action: Action) => void;
  onDelete: (action: Action) => void;
}

export function PrioritySection({ name, actions, onComplete, onDelete }: PrioritySectionProps) {
  const sortedActions = [...actions].sort((a, b) => {
    const aTarget = a.target_dates[a.target_dates.length - 1];
    const bTarget = b.target_dates[b.target_dates.length - 1];
    if (aTarget.getTime() !== bTarget.getTime()) {
      return aTarget.getTime() - bTarget.getTime();
    }
    return (a.order_key || 0) - (b.order_key || 0);
  });

  if (sortedActions.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3">{name}</h2>
      <div>
        {sortedActions.map((action) => (
          <ActionCard
            key={action.id}
            action={action}
            onComplete={onComplete}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
