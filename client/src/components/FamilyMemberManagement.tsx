
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { FamilyMember, CreateFamilyMemberInput, UpdateFamilyMemberInput } from '../../../server/src/schema';

interface FamilyMemberManagementProps {
  familyMembers: FamilyMember[];
  onDataChanged: () => void;
}

export function FamilyMemberManagement({ familyMembers, onDataChanged }: FamilyMemberManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  
  const [formData, setFormData] = useState<CreateFamilyMemberInput>({
    name: '',
    email: null,
    age: null
  });

  const [editFormData, setEditFormData] = useState<Omit<UpdateFamilyMemberInput, 'id'>>({
    name: '',
    email: null,
    age: null
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createFamilyMember.mutate(formData);
      setFormData({ name: '', email: null, age: null });
      onDataChanged();
    } catch (error) {
      console.error('Failed to create family member:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateFamilyMemberInput = {
        id: editingMember.id,
        ...editFormData
      };
      await trpc.updateFamilyMember.mutate(updateData);
      setEditingMember(null);
      setEditFormData({ name: '', email: null, age: null });
      onDataChanged();
    } catch (error) {
      console.error('Failed to update family member:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (member: FamilyMember) => {
    setEditingMember(member);
    setEditFormData({
      name: member.name,
      email: member.email,
      age: member.age
    });
  };

  const cancelEditing = () => {
    setEditingMember(null);
    setEditFormData({ name: '', email: null, age: null });
  };

  return (
    <div className="space-y-6">
      {/* Add New Family Member Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">➕ Add New Family Member</CardTitle>
          <CardDescription>Add someone new to your family fitness team</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateFamilyMemberInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateFamilyMemberInput) => ({
                      ...prev,
                      email: e.target.value || null
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Age in years"
                  value={formData.age || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateFamilyMemberInput) => ({
                      ...prev,
                      age: parseInt(e.target.value) || null
                    }))
                  }
                  min="1"
                  max="120"
                />
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Adding...' : '👨‍👩‍👧‍👦 Add Family Member'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Family Members List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Current Family Members ({familyMembers.length})</h3>
        
        {familyMembers.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">👥 No family members yet</p>
                <p>Add your first family member above to get started!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {familyMembers.map((member: FamilyMember) => (
              <Card key={member.id} className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  {editingMember?.id === member.id ? (
                    /* Edit Form */
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`edit-name-${member.id}`}>Name *</Label>
                          <Input
                            id={`edit-name-${member.id}`}
                            value={editFormData.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setEditFormData((prev) => ({ ...prev, name: e.target.value }))
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-email-${member.id}`}>Email</Label>
                          <Input
                            id={`edit-email-${member.id}`}
                            type="email"
                            value={editFormData.email || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setEditFormData((prev) => ({ ...prev, email: e.target.value || null }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-age-${member.id}`}>Age</Label>
                          <Input
                            id={`edit-age-${member.id}`}
                            type="number"
                            value={editFormData.age || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setEditFormData((prev) => ({ ...prev, age: parseInt(e.target.value) || null }))
                            }
                            min="1"
                            max="120"
                          />
                        </div>
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
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="text-xl font-semibold">{member.name}</h4>
                          {member.age && (
                            <Badge variant="secondary">Age {member.age}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {member.email ? (
                            <span>📧 {member.email}</span>
                          ) : (
                            <span className="text-gray-400">📧 No email provided</span>
                          )}
                          <span>📅 Joined {member.created_at.toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditing(member)}
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
                              <AlertDialogTitle>Remove Family Member</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove <strong>{member.name}</strong> from your family fitness tracker? 
                                This action cannot be undone and will also remove all their workout history.
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
                                Remove Member
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
        )}
      </div>
    </div>
  );
}
