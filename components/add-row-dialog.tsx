"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { apiRequest as axios } from "@/lib/api/client";
import * as utils from "@/lib/utils";
import FarmCreationModal from "@/components/farm-creation-modal";
import type { Row, Pen } from "@/types";
import { AddRowDialogProps } from "@/types";
import { planetNames } from "@/lib/constants";
import { useToast } from "@/lib/toast-provider";
import { api } from "@/lib/redux/api";
import { useAppDispatch } from "@/lib/redux/hooks";
import { fetchFresh } from "@/lib/redux/fetch-fresh";

export default function AddRowDialog({ open, onClose, onRowAdded, rowToEdit }: AddRowDialogProps) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [isFarmModalOpen, setIsFarmModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    capacity: "6",
    levels: "3",
  });
  const [customCapacity, setCustomCapacity] = useState("");
  const [existingRows, setExistingRows] = useState<Row[]>([]);
  const [existingPens, setExistingPens] = useState<Pen[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showSuccess, showError, showWarn } = useToast();
  const isEditing = !!rowToEdit;
  const farmId = user?.farm_id;

  const CAPACITY_OPTIONS = [6, 8, 12, 15, 18, 24, 30, 36, 42, 48, 54, 60, 72];

  const getValidLevels = (capacity: number) => {
    const possibleLevels = [1, 2, 3, 4, 5, 6];
    return possibleLevels.filter(level => capacity % level === 0);
  };


  useEffect(() => {
    if (!open || !farmId) return;

    // Pre-fill form for editing
    if (isEditing && rowToEdit) {
      // Capacities outside the preset list (e.g. 3 or 10 pens) go in the "Other" box.
      const preset = CAPACITY_OPTIONS.includes(Number(rowToEdit.capacity));
      setFormData({
        name: rowToEdit.name,
        description: rowToEdit.description || "",
        capacity: preset ? String(rowToEdit.capacity) : "other",
        levels: String(rowToEdit.levels?.length || 1),
      });
      setCustomCapacity(preset ? "" : String(rowToEdit.capacity ?? ""));
    } else {
      setFormData({ name: "", description: "", capacity: "6", levels: "3" });
      setCustomCapacity("");
    }


    const fetchData = async () => {
      try {

        const [newRows, newPens] = await Promise.all([
          fetchFresh<Row, string>(dispatch, api.endpoints.getRows, farmId),
          fetchFresh<Pen, string>(dispatch, api.endpoints.getPens, farmId),
        ]);
        setExistingRows(newRows);
        setExistingPens(newPens);
      } catch (error) {
        showError('Error', "Failed to fetch rows or pens.");
      }
    };
    fetchData();
    // Only re-run when the dialog opens or a different row is edited.
  }, [dispatch, open, farmId, rowToEdit?.id]);

  const getNextPlanetName = () => {
    const usedNames = existingRows.map((row) => row.name);
    const availableName = planetNames.find((name) => !usedNames.includes(name));
    return availableName || `Row-${existingRows.length + 1}`;
  };

  const generateLevels = (numLevels: number) => {
    return Array.from({ length: numLevels }, (_, i) => String.fromCharCode(65 + i));
  };

  // const distributePens = (capacity: number, numLevels: number) => {
  //   const levels = generateLevels(numLevels);
  //   const basePensPerLevel = Math.floor(capacity / numLevels);
  //   const remainder = capacity % numLevels;
  //   const distribution: { [key: string]: number } = {};

  //   levels.forEach((level, index) => {
  //     distribution[level] = basePensPerLevel + (index < remainder ? 1 : 0);
  //   });

  //   return distribution;
  // };

  const distributePens = (capacity: number, numLevels: number) => {
    const levels = generateLevels(numLevels);
    const pensPerLevel = capacity / numLevels; // This will now always be an integer due to validation
    const distribution: { [key: string]: number } = {};

    levels.forEach(level => {
      distribution[level] = pensPerLevel;
    });

    return distribution;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const capacity = formData.capacity === "other" ? parseInt(customCapacity) : parseInt(formData.capacity);
    const levels = parseInt(formData.levels);

    // Skip name uniqueness check for editing the same row
    if (formData.name && (!isEditing || formData.name !== rowToEdit?.name) && existingRows.some((row) => row.name === formData.name.trim())) {
      newErrors.name = `Row "${formData.name}" already exists.`;
    }
    if (isNaN(capacity) || capacity < 1) {
      newErrors.capacity = "Capacity must be a positive number.";
    }
    if (isNaN(levels) || levels < 1) {
      newErrors.levels = "Number of levels must be a positive number.";
    }
    // Levels are fixed when editing, so only new rows must split evenly across levels.
    if (!isEditing && capacity % levels !== 0) {
      newErrors.levels = "Capacity must be divisible by the number of levels.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const farmId = user?.farm_id;
    if (!farmId) {
      setIsFarmModalOpen(true);
      return;
    }

    if (!user?.farm_id) {
      showWarn('Error', "Farm ID is missing. Please log in again.");
      return;
    }

    if (!validateForm()) return

    setIsSubmitting(true);

    try {
      const newRowName = formData.name.trim() || getNextPlanetName();
      const capacity = formData.capacity === "other" ? parseInt(customCapacity) : parseInt(formData.capacity);
      const numLevels = parseInt(formData.levels);

      if (!user?.farm_id) throw new Error("Farm ID missing");

      if (isEditing && rowToEdit) {
        // A row's name and levels are fixed once its pens exist (pen names are built from them);
        // only the description and capacity can change. The API rejects a capacity below the pens already in the row.
        const response = await axios.put(`${utils.apiUrl}/rows/update/${rowToEdit.id}`, {
          description: formData.description || null,
          capacity,
        });
        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to update row");
        }
        showSuccess("Success", `Row "${rowToEdit.name}" updated successfully!`)
      } else {
        // Add mode: Create new row
        if (existingRows.some((row) => row.name === newRowName)) {
          showWarn('Error', `Row "${newRowName}" already exists. Please choose a different name.`);
          setIsSubmitting(false);
          return;
        }

        const newRow: Row = {
          name: newRowName,
          farm_id: user.farm_id,
          description: formData.description || `${newRowName} row with ${capacity} pens across ${numLevels} levels`,
          capacity,
          levels: generateLevels(numLevels),
          is_deleted: 0,
          occupied: 0
        };

        const response = await axios.post(`${utils.apiUrl}/rows/create`, newRow, {
          
        });

        if (!response.data.success) {
          showError('Error', response.data.message || "Failed to create row")
        }
        const newPens: Pen[] = response?.data?.data?.pens ?? [];
        const updatedRows = [...existingRows, response?.data?.data?.rows];
        const updatedPens = [...existingPens, ...newPens];
        setExistingRows(updatedRows);
        setExistingPens(updatedPens);
        showSuccess('Success', `Successfully created row "${newRowName}" with ${capacity} pens across ${numLevels} levels!`);
      }

      setFormData({ name: "", description: "", capacity: "6", levels: "3" });
      setCustomCapacity("");
      dispatch(api.util.invalidateTags([
        { type: "Rows", id: user.farm_id },
        { type: "Pens", id: user.farm_id },
      ]));
      onClose();
      if (onRowAdded) {
        onRowAdded();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || (isEditing ? "Error updating row." : "Error creating row.");
      showError('Error', errorMessage);
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isEditing) return;
    const capacityNum = formData.capacity === "other" ? parseInt(customCapacity || "0") : parseInt(formData.capacity || "0");
    const levelsNum = parseInt(formData.levels);
    const validLevels = getValidLevels(capacityNum);
    if (capacityNum > 0 && !validLevels.includes(levelsNum) && validLevels.length > 0) {
      setFormData(prev => ({
        ...prev,
        levels: validLevels[0].toString(),
      }));
    }
  }, [formData.capacity, customCapacity]);

  const effectiveCapacity = formData.capacity === "other" ? parseInt(customCapacity || "0") : parseInt(formData.capacity || "0");

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          onClose();
          if (!isOpen) {
            document.body.focus();
          }
        }}
      >
        <DialogContent
          className="sm:max-w-md bg-white dark:bg-gray-900 rounded-lg max-h-[80vh] overflow-y-auto"
          onInteractOutside={e => e.preventDefault()}
          onPointerDownOutside={e => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              {isEditing ? `Edit Row ${rowToEdit?.name}` : "Add Row"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium dark:text-gray-200"
              >
                Row Name
              </Label>
              <Input
                id="name"
                placeholder={isEditing ? rowToEdit?.name : `Suggested: ${getNextPlanetName()}`}
                value={formData.name}
                disabled={isEditing}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100"
              />
              {isEditing && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  The name and levels can&apos;t change once pens exist, because pen names are built from them.
                </p>
              )}
              {!isEditing && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Leave empty to use: {getNextPlanetName()}
                </p>
              )}
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="capacity"
                className="text-sm font-medium dark:text-gray-200"
              >
                Capacity
              </Label>
              <Select
                value={formData.capacity}
                onValueChange={value =>
                  setFormData({ ...formData, capacity: value })
                }
              >
                <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Select capacity" />
                </SelectTrigger>
                <SelectContent>
                  {CAPACITY_OPTIONS.map(cap => (
                    <SelectItem key={cap} value={cap.toString()}>
                      {cap} Pens
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.capacity && (
                <p className="text-xs text-red-500">{errors.capacity}</p>
              )}
            </div>
            {formData.capacity === "other" && (
              <div className="space-y-2">
                <Label
                  htmlFor="custom-capacity"
                  className="text-sm font-medium dark:text-gray-200"
                >
                  Custom Capacity (enter a number)
                </Label>
                <Input
                  id="custom-capacity"
                  type="number"
                  min="1"
                  value={customCapacity}
                  onChange={e => setCustomCapacity(e.target.value)}
                  className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label
                htmlFor="levels"
                className="text-sm font-medium dark:text-gray-200"
              >
                Number of Levels
              </Label>
              <Select
                value={formData.levels}
                disabled={isEditing}
                onValueChange={value =>
                  setFormData({ ...formData, levels: value })
                }
              >
                <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Select number of levels" />
                </SelectTrigger>
                <SelectContent>
                  {(isEditing ? [Number(formData.levels)] : getValidLevels(effectiveCapacity)).map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} Levels
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.levels && (
                <p className="text-xs text-red-500">{errors.levels}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium dark:text-gray-200"
              >
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe this row's purpose or location..."
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 dark:text-gray-100"
                rows={3}
              />
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-800 dark:text-blue-400 mb-2">
                Row Configuration
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-500 space-y-1">
                <li>
                  · {formData.levels} Levels (
                  {generateLevels(parseInt(formData.levels)).join(", ")})
                </li>
                <li>· {effectiveCapacity || "N/A"} Total Pens</li>
                <li>· Each pen includes water bottle and feeder</li>
              </ul>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-800 dark:text-green-400 mb-2">
                Current Status
              </h4>
              <p className="text-sm text-green-700 dark:text-green-500">
                Existing rows: {existingRows.length} | Total pens:{" "}
                {existingPens.length}
              </p>
              {/* <p className="text-sm text-green-700 dark:text-green-500 mt-1">
                Next row will be: <strong>{getNextPlanetName()}</strong>
              </p> */}
            </div>
            {errors.submit && (
              <div className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-400 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {errors.submit}
              </div>
            )}
            <DialogFooter className="flex justify-end gap-2 sm:gap-0 space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="dark:border-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
              >
                {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Row" : "Create Row & Pens")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <FarmCreationModal
        isOpen={isFarmModalOpen}
        onClose={() => {
          setIsFarmModalOpen(false);
          onClose();
        }}
        onFarmCreated={() => {
          setIsFarmModalOpen(false);
        }}
      />
    </>
  );
}