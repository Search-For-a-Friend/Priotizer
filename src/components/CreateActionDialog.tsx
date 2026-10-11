import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TIME_INTERVALS } from '../types';
import { addHours } from 'date-fns';

interface CreateActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (description: string, targetDate: Date, labels: string[]) => void;
}

export function CreateActionDialog({ isOpen, onClose, onCreate }: CreateActionDialogProps) {
  const [description, setDescription] = useState('');
  const [selectedInterval, setSelectedInterval] = useState('1 day');
  const [customDate, setCustomDate] = useState('');
  const [labels, setLabels] = useState('');
  const [useCustomDate, setUseCustomDate] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) return;
    
    let targetDate: Date;
    if (useCustomDate && customDate) {
      targetDate = new Date(customDate);
    } else {
      const interval = TIME_INTERVALS.find(ti => ti.name === selectedInterval);
      const hours = interval?.hours || 24;
      targetDate = addHours(new Date(), hours);
    }
    
    const labelArray = labels
      .split(',')
      .map(l => l.trim())
      .filter(l => l.length > 0);
    
    onCreate(description, targetDate, labelArray);
    
    // Reset form
    setDescription('');
    setSelectedInterval('1 day');
    setCustomDate('');
    setLabels('');
    setUseCustomDate(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create New Action</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Description *</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter action description"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Target Date</label>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={!useCustomDate ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUseCustomDate(false)}
                >
                  Use Interval
                </Button>
                <Button
                  type="button"
                  variant={useCustomDate ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUseCustomDate(true)}
                >
                  Custom Date
                </Button>
              </div>
              
              {!useCustomDate ? (
                <Select
                  value={selectedInterval}
                  onChange={(e) => setSelectedInterval(e.target.value)}
                >
                  {TIME_INTERVALS.map((interval) => (
                    <option key={interval.name} value={interval.name}>
                      {interval.name}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  type="datetime-local"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  required
                />
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Labels (comma-separated)</label>
              <Input
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
                placeholder="work, urgent, personal"
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
