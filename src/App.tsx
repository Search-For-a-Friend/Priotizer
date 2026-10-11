import { useState, useEffect } from 'react';
import type { Action, Granularity } from './types';
import { Button } from './components/ui/button';
import { Select } from './components/ui/select';
import { PrioritySection } from './components/PrioritySection';
import { CreateActionDialog } from './components/CreateActionDialog';
import { getPrioritySections, getActionPrioritySection } from './lib/timeUtils';
import { createAction, completeAction, deleteAction } from './lib/actionUtils';
import { persistence } from './lib/persistence';
import { Plus, Settings } from 'lucide-react';

function App() {
  const [actions, setActions] = useState<Action[]>([]);
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await persistence.load();
    setActions(data.actions);
    setGranularity(data.granularity);
  };

  const saveData = async (newActions: Action[], newGranularity?: Granularity) => {
    const dataToSave = {
      actions: newActions,
      granularity: newGranularity || granularity,
    };
    await persistence.save(dataToSave);
    if (newGranularity) {
      setGranularity(newGranularity);
    }
  };

  const handleCreateAction = (description: string, targetDate: Date, labels: string[]) => {
    const newAction = createAction(description, targetDate, labels, actions);
    const updatedActions = [...actions, newAction];
    setActions(updatedActions);
    saveData(updatedActions);
  };

  const handleCompleteAction = (action: Action) => {
    const updated = completeAction(action);
    const updatedActions = actions.map(a => a.id === action.id ? updated : a);
    setActions(updatedActions);
    saveData(updatedActions);
  };

  const handleDeleteAction = (action: Action) => {
    const updated = deleteAction(action);
    const updatedActions = actions.map(a => a.id === action.id ? updated : a);
    setActions(updatedActions);
    saveData(updatedActions);
  };

  const handleGranularityChange = async (newGranularity: Granularity) => {
    if (newGranularity === granularity) return;

    // Check if changing to larger granularity
    const currentHours = granularity === 'hour' ? 1 : granularity === 'half-day' ? 12 : 24;
    const newHours = newGranularity === 'hour' ? 1 : newGranularity === 'half-day' ? 12 : 24;
    
    if (newHours > currentHours) {
      // Truncate target dates
      const confirmChange = confirm('Changing to larger granularity will truncate target dates. Continue?');
      if (!confirmChange) return;
    }

    const updatedActions = actions.map(action => {
      const currentTarget = action.target_dates[action.target_dates.length - 1];
      const truncated = new Date(currentTarget);
      
      if (newGranularity === 'day') {
        truncated.setHours(0, 0, 0, 0);
        if (currentTarget.getHours() >= 12) {
          truncated.setDate(truncated.getDate() + 1);
        }
      } else if (newGranularity === 'half-day') {
        const hour = currentTarget.getHours();
        truncated.setMinutes(0, 0, 0);
        truncated.setHours(hour < 12 ? 0 : 12);
      }
      // hour: no change needed
      
      return {
        ...action,
        target_dates: [...action.target_dates.slice(0, -1), truncated],
      };
    });

    setActions(updatedActions);
    await saveData(updatedActions, newGranularity);
  };

  // Group actions by priority section
  const now = new Date();
  const sections = getPrioritySections(granularity);
  
  const sectionedActions = sections.map(section => {
    const sectionActions = actions.filter(action => {
      if (action.status !== 'pending') return false;
      const prioritySection = getActionPrioritySection(action, granularity, now);
      return prioritySection === sections.indexOf(section);
    });
    return {
      ...section,
      actions: sectionActions,
    };
  });

  const completedActions = actions.filter(a => a.status === 'completed');
  const deletedActions = actions.filter(a => a.status === 'deleted');

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Action Planner</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Action
            </Button>
          </div>
        </div>

        {isSettingsOpen && (
          <div className="mb-6 p-4 border rounded-lg bg-card">
            <h3 className="font-semibold mb-2">Settings</h3>
            <div className="flex items-center gap-2">
              <label className="text-sm">Granularity:</label>
              <Select
                value={granularity}
                onChange={(e) => handleGranularityChange(e.target.value as Granularity)}
              >
                <option value="hour">Hour</option>
                <option value="half-day">Half-day</option>
                <option value="day">Day</option>
              </Select>
            </div>
          </div>
        )}

        {sectionedActions.map(section => (
          <PrioritySection
            key={section.name}
            name={section.name}
            actions={section.actions}
            onComplete={handleCompleteAction}
            onDelete={handleDeleteAction}
          />
        ))}

        {completedActions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">✅ Completed</h2>
            {completedActions.map(action => (
              <PrioritySection
                key={action.id}
                name=""
                actions={[action]}
                onComplete={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        )}

        {deletedActions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">🗑️ Trash</h2>
            {deletedActions.map(action => (
              <PrioritySection
                key={action.id}
                name=""
                actions={[action]}
                onComplete={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        )}

        <CreateActionDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onCreate={handleCreateAction}
        />
      </div>
    </div>
  );
}

export default App;
