"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { useToast } from "@/lib/toast-provider";

const PreferenceModal: React.FC<{
    open: boolean
    onClose: () => void
    type: 'breed' | 'color'
    currentList: string[]
    onSave: (newList: string[]) => Promise<void>
}> = ({ open, onClose, type, currentList, onSave }) => {
    const [newItem, setNewItem] = useState("");
    const [list, setList] = useState<string[]>(currentList);
    const [isSaving, setIsSaving] = useState(false);
    const { showSuccess, showError } = useToast();

    useEffect(() => {
        setList(currentList);
    }, [currentList]);

    const handleAdd = () => {
        const trimmed = newItem.trim();
        if (trimmed && !list.includes(trimmed)) {
            setList([...list, trimmed]);
            setNewItem("");
        }
    };

    const handleRemove = (item: string) => {
        setList(list.filter((i) => i !== item));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(list.sort());
            showSuccess("Success", `${type.charAt(0).toUpperCase() + type.slice(1)} preferences saved`);
            onClose();
        } catch (error) {
            showError("Error", "Failed to save preferences");
        } finally {
            setIsSaving(false);
        }
    };

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className="sm:max-w-[500px] bg-white dark:bg-gray-800"
          onInteractOutside={e => e.preventDefault()}
          onPointerDownOutside={e => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              Manage {type.charAt(0).toUpperCase() + type.slice(1)} Preferences
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                placeholder={`Enter new ${type}`}
                className="flex-1"
              />
              <Button onClick={handleAdd} disabled={!newItem.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[100px] border rounded-md p-2">
              {list.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No {type}s added yet
                </p>
              )}
              {list.map(item => (
                <Badge
                  key={item}
                  className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors duration-200 px-3 py-2 text-sm min-h-[40px] flex items-center justify-center min-w-[40px] max-w-[180px] break-words rounded-full"
                >
                  {item}
                  <X
                    className="h-4 w-4 cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 transition-colors ml-1"
                    onClick={() => handleRemove(item)}
                  />
                </Badge>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-500 text-white text-sm md:text-base"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
};

export default PreferenceModal;