"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";
import * as utils from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import type { EditPigDialogProps, Pig as PigType } from "@/types";
import { Circle } from "lucide-react";
import { breeds, colors } from "@/lib/constants";
import { useToast } from "@/lib/toast-provider";


export default function EditPigDialog({ pig, onClose, onUpdate }: EditPigDialogProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: pig.name || "",
    breed: pig.breed || "",
    color: pig.color || "",
    weight: pig.weight?.toString() || "",
    birth_date: pig.birth_date ? new Date(pig.birth_date).toISOString().split("T")[0] : "",
    gender: pig.gender || "male",
    is_pregnant: pig.is_pregnant || false,
    pen_id: pig.pen_id || "",
    pregnancy_start_date: pig.pregnancy_start_date ? new Date(pig.pregnancy_start_date).toISOString().split("T")[0] : "",
    expected_birth_date: pig.expected_birth_date ? new Date(pig.expected_birth_date).toISOString().split("T")[0] : "",
    boar_id: pig.mated_with || "",
    mating_date: pig.last_mating_date ? new Date(pig.last_mating_date).toISOString().split("T")[0] : "",
  });


  const [error, setError] = useState<string | null>(null);
  const [boars, setBoars] = useState<PigType[]>([]);
  const [farmBreeds, setFarmBreeds] = useState<string[]>([]);
  const [farmColors, setFarmColors] = useState<string[]>([]);
  const { showSuccess, showError, showWarn } = useToast();

  const farmData = useMemo(() => {
    const data = localStorage.getItem('pig_farm_data');
    return data ? JSON.parse(data) : {};
  }, []);

  useEffect(() => {
    setFarmBreeds(farmData.breeds || breeds);
    setFarmColors(farmData.colors || colors);
  }, [farmData]);

  // Check if the pig is pregnant and has been served
  const isPregnantAndServed = pig.is_pregnant && (pig.last_mating_date || pig.pregnancy_start_date);

  // Fetch available boars
  useEffect(() => {
    const fetchBoars = async () => {
      if (!user?.farm_id) return;
      const cachedPigs: any = localStorage.getItem(`pig_farm_pigs_${user?.farm_id}`);
      const pigs = JSON.parse(cachedPigs);
      const malePigs = pigs.filter((r: PigType) => r.gender === "male" && utils.isPigMature(r).isMature);
      setBoars(malePigs);
    };
    fetchBoars();
  }, [user?.farm_id, showError]);

  // Autofill pregnancy_start_date and expected_birth_date based on mating_date
  useEffect(() => {
    if (formData.is_pregnant && formData.mating_date) {
      const matingDate = new Date(formData.mating_date);
      if (!isNaN(matingDate.getTime())) {
        const pregnancyStartDate = matingDate.toISOString().split("T")[0];
        const expectedBirthDate = new Date(matingDate.getTime() + (utils.PREGNANCY_DURATION_DAYS || 114) * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        setFormData((prev) => ({
          ...prev,
          pregnancy_start_date: pregnancyStartDate,
          expected_birth_date: expectedBirthDate,
        }));
      }
    } else if (!formData.is_pregnant) {
      setFormData((prev) => ({
        ...prev,
        pregnancy_start_date: "",
        expected_birth_date: "",
        boar_id: "",
        mating_date: "",
      }));
    }
  }, [formData.is_pregnant, formData.mating_date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.farm_id) {
      showError('Error', "Missing farm ID. Please log in again.");
      return;
    }

    try {
      const token = localStorage.getItem("pig_farm_token");
      if (!token) throw new Error("No authentication token found");

      const isPregnantAndServed = formData.is_pregnant && formData.boar_id && formData.mating_date;
      const updatedPig = {
        name: isPregnantAndServed ? pig.name : formData.name,
        breed: isPregnantAndServed ? pig.breed : formData.breed,
        color: isPregnantAndServed ? pig.color : formData.color,
        weight: Number.parseFloat(formData.weight) || null,
        birth_date: isPregnantAndServed ? pig.birth_date : formData.birth_date || null,
        gender: isPregnantAndServed ? pig.gender : formData.gender as "male" | "female",
        is_pregnant: formData.is_pregnant,
        pen_id: formData.pen_id || null,
        pregnancy_start_date: formData.is_pregnant ? formData.pregnancy_start_date || null : null,
        expected_birth_date: formData.is_pregnant ? formData.expected_birth_date || null : null,
        status: "active",
        notes: pig.notes || null,
      };

      const pigResponse = await axios.put(
        `${utils.apiUrl}/pigs/${user.farm_id}/${pig.pig_id}`,
        updatedPig,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!pigResponse.data.success) {
        showError('Error', 'Failed to update pig data');
        return;
      }
      if (isPregnantAndServed) {
        const matingDate = new Date(formData.mating_date).toISOString().split('T')[0];
        const expectedBirthDate = new Date(new Date(matingDate).getTime() + (utils.PREGNANCY_DURATION_DAYS || 114) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        await axios.post(`${utils.apiUrl}/breeds/${user.farm_id}`,
          {
            farm_id: user.farm_id,
            sow_id: pig.pig_id,
            boar_id: formData.boar_id,
            mating_date: matingDate,
            expected_birth_date: expectedBirthDate,
            notes: `Breeding recorded on ${new Date().toISOString().split('T')[0]}`,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      onUpdate(pigResponse.data.data);
      const cachedPigs = JSON.parse(localStorage.getItem(`pig_farm_pigs_${user.farm_id}`) || '[]') as PigType[];
      const updatedPigs = cachedPigs.map((r) => (r.id === pig.id ? pigResponse.data.data : r));
      localStorage.setItem(`pig_farm_pigs_${user.farm_id}`, JSON.stringify(updatedPigs));
      showSuccess('Success', 'Pig updated successfully!');
      onClose();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'An error occurred while updating the pig.');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[600px] bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-white/20 dark:border-gray-600/20 max-h-[80vh] overflow-y-auto shadow-2xl"
        onInteractOutside={e => e.preventDefault()}
        onPointerDownOutside={e => e.preventDefault()}
      >
        <DialogHeader className="bg-gradient-to-r from-blue-50/80 to-blue-100/80 dark:from-blue-900/30 dark:to-blue-800/30 -m-6 mb-6 p-6 rounded-t-lg border-b border-blue-200 dark:border-blue-700">
          <DialogTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
            <Circle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>Edit Pig Profile - {pig.pig_id}</span>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg border border-red-200 dark:border-red-700">
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          )}
          {isPregnantAndServed && (
            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                This pig is pregnant and has been served. Critical details
                (name, breed, color, birth date, gender) cannot be edited.
              </p>
            </div>
          )}
          <div>
            <Label
              htmlFor="name"
              className="text-gray-900 dark:text-gray-100"
            >
              Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={!!isPregnantAndServed}
              className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <Label
              htmlFor="breed"
              className="text-gray-900 dark:text-gray-100"
            >
              Breed
            </Label>
            <Select
              value={formData.breed}
              onValueChange={value =>
                setFormData({ ...formData, breed: value })
              }
              disabled={!!isPregnantAndServed}
            >
              <SelectTrigger className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="Select breed" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                {farmBreeds.map(breed => (
                  <SelectItem key={breed} value={breed}>
                    {breed}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label
              htmlFor="color"
              className="text-gray-900 dark:text-gray-100"
            >
              Color
            </Label>
            <Select
              value={formData.color}
              onValueChange={value =>
                setFormData({ ...formData, color: value })
              }
              disabled={!!isPregnantAndServed}
            >
              <SelectTrigger className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                {farmColors.map(color => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label
              htmlFor="weight"
              className="text-gray-900 dark:text-gray-100"
            >
              Weight (kg)
            </Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={e =>
                setFormData({ ...formData, weight: e.target.value })
              }
              className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <Label
              htmlFor="birth_date"
              className="text-gray-900 dark:text-gray-100"
            >
              Birth Date
            </Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={e =>
                setFormData({ ...formData, birth_date: e.target.value })
              }
              disabled={!!isPregnantAndServed}
              className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <Label
              htmlFor="gender"
              className="text-gray-900 dark:text-gray-100"
            >
              Gender
            </Label>
            <Select
              value={formData.gender}
              onValueChange={value =>
                setFormData({
                  ...formData,
                  gender: value as "male" | "female",
                })
              }
              disabled={!!isPregnantAndServed}
            >
              <SelectTrigger className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                <SelectItem value="male">Boar</SelectItem>
                <SelectItem value="female">Sow</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.gender === "female" && (
            <>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_pregnant}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        is_pregnant: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    Pregnant
                  </span>
                </label>
              </div>
              {formData.is_pregnant && (
                <>
                  <div>
                    <Label
                      htmlFor="boar_id"
                      className="text-gray-900 dark:text-gray-100"
                    >
                      Select Boar
                    </Label>
                    <Select
                      value={formData.boar_id}
                      onValueChange={value =>
                        setFormData({ ...formData, boar_id: value })
                      }
                    >
                      <SelectTrigger className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                        <SelectValue placeholder="Select boar" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                        {boars.map(boar => (
                          <SelectItem
                            key={boar.pig_id}
                            value={boar.pig_id ?? ""}
                          >
                            {boar.name} ({boar.pen_id || "N/A"}) -{" "}
                            {boar.breed}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label
                      htmlFor="mating_date"
                      className="text-gray-900 dark:text-gray-100"
                    >
                      Mating Date
                    </Label>
                    <Input
                      id="mating_date"
                      type="date"
                      value={formData.mating_date}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          mating_date: e.target.value,
                        })
                      }
                      className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="pregnancy_start_date"
                      className="text-gray-900 dark:text-gray-100"
                    >
                      Pregnancy Start Date
                    </Label>
                    <Input
                      id="pregnancy_start_date"
                      type="date"
                      value={formData.pregnancy_start_date}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          pregnancy_start_date: e.target.value,
                        })
                      }
                      className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="expected_birth_date"
                      className="text-gray-900 dark:text-gray-100"
                    >
                      Expected Birth Date
                    </Label>
                    <Input
                      id="expected_birth_date"
                      type="date"
                      value={formData.expected_birth_date}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          expected_birth_date: e.target.value,
                        })
                      }
                      className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </>
              )}
            </>
          )}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}