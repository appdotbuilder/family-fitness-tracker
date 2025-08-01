
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { Equipment, CreateEquipmentInput, UpdateEquipmentInput } from '../../../server/src/schema';

interface EquipmentManagementProps {
  equipment: Equipment[];
  onDataChanged: () => void;
}

const EQUIPMENT_CATEGORIES = [
  'Free Weights',
  'Cardio',
  'Strength Machines',
  'Resistance Bands',
  'Functional Training',
  'Recovery',
  'Other'
];

export function EquipmentManagement({ equipment, onDataChanged }: EquipmentManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  
  const [formData, setFormData] = useState<CreateEquipmentInput>({
    name: '',
    description: null,
    category: null
  });

  const [editFormData, setEditFormData] = useState<Omit<UpdateEquipmentInput, 'id'>>({
    name: '',
    description: null,
    category: null
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createEquipment.mutate(formData);
      setFormData({ name: '', description: null, category: null });
      onDataChanged();
    } catch (error) {
      console.error('Failed to create equipment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquipment) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateEquipmentInput = {
        id: editingEquipment.id,
        ...editFormData
      };
      await trpc.updateEquipment.mutate(updateData);
      setEditingEquipment(null);
      setEditFormData({ name: '', description: null, category: null });
      onDataChanged();
    } catch (error) {
      console.error('Failed to update equipment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (item: Equipment) => {
    setEditingEquipment(item);
    setEditFormData({
      name: item.name,
      description: item.description,
      category: item.category
    });
  };

  const cancelEditing = () => {
    setEditingEquipment(null);
    setEditFormData({ name: '', description: null, category: null });
  };

  const getCategoryEmoji = (category: string | null) => {
    if (!category) return '🏋️';
    const emojiMap: Record<string, string> = {
      'Free Weights': '🏋️',
      'Cardio': '🏃',
      'Strength Machines': '⚙️',
      'Resistance Bands': '🎯',
      'Functional Training': '🤸',
      'Recovery': '🧘',
      'Other': '🔧'
    };
    return emojiMap[category] || '🏋️';
  };

  const equipmentByCategory = equipment.reduce((acc: Record<string, Equipment[]>, item: Equipment) => {
    const category = item.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Add New Equipment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🛠️ Add New Equipment</CardTitle>
          <CardDescription>Expand your home gym inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipment-name">Equipment Name *</Label>
                <Input
                  id="equipment-name"
                  placeholder="e.g., Adjustable Dumbbells"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateEquipmentInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipment-category">Category</Label>
                <Select
                  value={formData.category || ''}
                  onValueChange={(value: string) =>
                    setFormData((prev: CreateEquipmentInput) => ({ ...prev, category: value || null }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_CATEGORIES.map((category: string) => (
                      <SelectItem key={category} value={category}>
                        {getCategoryEmoji(category)} {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipment-description">Description</Label>
              <Textarea
                id="equipment-description"
                placeholder="Describe the equipment, its features, weight range, etc."
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateEquipmentInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                rows={3}
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Adding...' : '🏋️ Add Equipment'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Equipment List by Category */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Your Home Gym Equipment ({equipment.length} items)</h3>
        
        {equipment.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">🏋️ No equipment registered yet</p>
                <p>Add your first piece of equipment above to start building your home gym inventory!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(equipmentByCategory).map(([category, items]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-semibold">{getCategoryEmoji(category)} {category}</h4>
                  <Badge variant="secondary">{items.length} items</Badge>
                </div>
                <div className="grid gap-3">
                  {items.map((item: Equipment) => (
                    <Card key={item.id} className="transition-shadow hover:shadow-md">
                      <CardContent className="pt-4">
                        {editingEquipment?.id === item.id ? (
                          /* Edit Form */
                          <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`edit-name-${item.id}`}>Equipment Name *</Label>
                                <Input
                                  id={`edit-name-${item.id}`}
                                  value={editFormData.name}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setEditFormData((prev) => ({ ...prev, name: e.target.value }))
                                  }
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`edit-category-${item.id}`}>Category</Label>
                                <Select
                                  value={editFormData.category || ''}
                                  onValueChange={(value: string) =>
                                    setEditFormData((prev) => ({ ...prev, category: value || null }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {EQUIPMENT_CATEGORIES.map((cat: string) => (
                                      <SelectItem key={cat} value={cat}>
                                        {getCategoryEmoji(cat)} {cat}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-description-${item.id}`}>Description</Label>
                              <Textarea
                                id={`edit-description-${item.id}`}
                                value={editFormData.description || ''}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                  setEditFormData((prev) => ({ ...prev, description: e.target.value || null }))
                                }
                                
                                rows={3}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Saving...' : '💾 Save Changes'}
                              </Button>
                              <Button type="button" variant="outline" onClick={cancelEditing}>
                                ❌ Cancel
                              </Button>
                            </div>
                          </form>
                        ) : (
                          /* Display Mode */
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <h5 className="text-lg font-semibold">{item.name}</h5>
                              </div>
                              {item.description && (
                                <p className="text-gray-600 text-sm">{item.description}</p>
                              )}
                              <p className="text-xs text-gray-400">
                                Added {item.created_at.toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditing(item)}
                              >
                                ✏️ Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    🗑️ Remove
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Equipment</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove <strong>{item.name}</strong> from your equipment list? 
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        // Note: No delete endpoint available, so this is a placeholder
                                        console.log('Delete functionality would be implemented here');
                                      }}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Remove Equipment
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
