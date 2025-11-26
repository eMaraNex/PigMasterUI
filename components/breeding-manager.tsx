"use client"

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Plus, AlertTriangle } from "lucide-react";
import axios from "axios";
import * as utils from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import type { BreedingManagerProps, BreedingRecord, CompatibilityResult, Pig } from "@/types";
import { useToast } from '@/lib/toast-provider';


const checkInbreeding = (sow: Pig, boar: Pig): boolean => {
  if (sow.parent_male_id === boar.id || sow.parent_female_id === boar.id) return true;
  if (boar.parent_male_id === sow.id || boar.parent_female_id === sow.id) return true;
  if (sow.parent_male_id === boar.parent_male_id && sow.parent_male_id) return true;
  if (sow.parent_female_id === boar.parent_female_id && sow.parent_female_id) return true;
  return false;
};

export default function BreedingManager({ pigs: initialPigs, onPigsUpdate, hutches }: BreedingManagerProps) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [selectedSow, setSelectedSow] = useState<string>("");
  const [selectedBoar, setSelectedBoar] = useState<string>("");
  const [pigs, setPigs] = useState<Pig[]>(initialPigs);
  const [breedingRecords, setBreedingRecords] = useState<BreedingRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(false);
  const [isFetchingPigs, setIsFetchingPigs] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sync local pigs state with initialPigs prop when it changes
  useEffect(() => {
    setPigs(initialPigs);
  }, [initialPigs]);

  const sows = pigs.filter((r) => r.gender === "female");
  const boars = pigs.filter((r) => r.gender === "male");
  const availableSows = sows.filter((r) => !r.is_pregnant && utils.isPigMature(r).isMature);
  const pregnantSows = sows.filter((r) => r.is_pregnant);
  const availableBoars = boars.filter((r) => utils.isPigMature(r).isMature);

  const getBreedingCompatibility = (sowId: string, boarId: string): CompatibilityResult => {
    const sow = pigs.find((r) => r.id === sowId);
    const boar = pigs.find((r) => r.id === boarId);

    if (!sow || !boar) {
      return { compatible: false, reason: "Invalid selection" };
    }

    const sowMaturity = utils.isPigMature(sow);
    if (!sowMaturity.isMature) {
      return { compatible: false, reason: `Sow ${sow.name} (${sow.hutch_id || 'N/A'}): ${sowMaturity.reason}` };
    }

    const boarMaturity = utils.isPigMature(boar);
    if (!boarMaturity.isMature) {
      return { compatible: false, reason: `Boar ${boar.name} (${boar.hutch_id || 'N/A'}): ${boarMaturity.reason}` };
    }

    if (checkInbreeding(sow, boar)) {
      return { compatible: false, reason: "Potential inbreeding detected" };
    }

    if (sow.is_pregnant) {
      return { compatible: false, reason: "Sow is currently pregnant" };
    }

    return { compatible: true, reason: "Compatible for breeding" };
  };

  const handleScheduleBreeding = async (): Promise<void> => {
    if (!selectedSow || !selectedBoar || !user?.farm_id) return;

    const compatibility = getBreedingCompatibility(selectedSow, selectedBoar);
    if (!compatibility.compatible) {
      showError('Error', "Cannot Schedule Breeding");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const sow = pigs.find((r) => r.id === selectedSow);
      const boar = pigs.find((r) => r.id === selectedBoar);
      if (!sow || !boar) throw new Error("Invalid pig selection");

      const matingDate = new Date().toISOString().split("T")[0];
      const expectedBirthDate = new Date(new Date(matingDate).getTime() + (utils.PREGNANCY_DURATION_DAYS || 114) * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      // Update pig state locally
      const updatedPigs = pigs.map((r) =>
        r.id === selectedSow
          ? {
            ...r,
            is_pregnant: true,
            pregnancy_start_date: matingDate,
            expected_birth_date: expectedBirthDate,
            mated_with: boar.name,
          }
          : r
      );
      setPigs(updatedPigs);

      const breedResponse = await axios.post(`${utils.apiUrl}/breeds/${user.farm_id}`, {
        farm_id: user.farm_id,
        sow_id: sow.pig_id,
        boar_id: boar.pig_id,
        mating_date: matingDate,
        expected_birth_date: expectedBirthDate,
        notes: `Scheduled on ${matingDate}`,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("pig_farm_token")}` },
      });

      if (breedResponse.status === 201) {
        setSuccess("Breeding scheduled successfully!");
        showSuccess('Success', "Breeding scheduled successfully!");
        setSelectedSow("");
        setSelectedBoar("");
        onPigsUpdate(updatedPigs);
        await fetchBreedingRecords();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to schedule breeding. Please try again.";
      setError(errorMessage);
      showError('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPigs = useCallback(async (retryCount = 0): Promise<void> => {
    if (!user?.farm_id || isFetchingPigs) {
      return;
    }
    setIsFetchingPigs(true);
    try {
      const response = await axios.get(`${utils.apiUrl}/pigs/${user.farm_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("pig_farm_token")}` },
      });
      const newPigs = response.data.data || [];
      setPigs(newPigs);
      onPigsUpdate(newPigs);
    } catch (err: any) {
      if (retryCount < 1) {
        const delay = 2000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        await fetchPigs(retryCount + 1);
      } else {
        showError('Error', "Failed to fetch pigs after retries.");
      }
    } finally {
      setIsFetchingPigs(false);
    }
  }, [user?.farm_id]);

  const fetchBreedingRecords = useCallback(async (): Promise<void> => {
    if (!user?.farm_id) {
      return;
    }
    setIsLoadingRecords(true);
    try {
      const response = await axios.get(`${utils.apiUrl}/breeds/${user.farm_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("pig_farm_token")}` },
      });
      const records = response.data.data || [];
      setBreedingRecords(records);
    } catch (err: any) {
      setBreedingRecords([]);
      showError('Error', "Failed to fetch breeding records.");
    } finally {
      setIsLoadingRecords(false);
    }
  }, [user?.farm_id]);

  useEffect(() => {
    if (user?.farm_id && !isFetchingPigs && !isLoadingRecords) {
      Promise.all([fetchPigs(), fetchBreedingRecords()]).catch((err) =>
        console.error("Error fetching initial data:", err)
      );
    }
  }, [user?.farm_id]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
              Available Sows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
              {availableSows.length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ready for breeding
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
              Pregnant Sows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-red-600 dark:from-pink-400 dark:to-red-400 bg-clip-text text-transparent">
              {pregnantSows.length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Currently expecting
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
              Active Boars
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              {availableBoars.length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Available for breeding
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breeding Planner */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-pink-50/80 to-red-50/80 dark:from-pink-900/30 dark:to-red-900/30 border-b border-gray-200 dark:border-gray-600">
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            <span className="text-gray-900 dark:text-gray-100">
              Breeding Planner
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-100">
                Select Sow
              </label>
              <Select value={selectedSow} onValueChange={setSelectedSow}>
                <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Choose a sow" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  {availableSows.map((sow) => (
                    <SelectItem key={sow.id} value={sow.id || ''}>
                      {sow.name} ({sow.hutch_name || 'N/A'}) - {sow.breed} {!utils.isPigMature(sow).isMature ? '(Too Young)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-100">
                Select Boar
              </label>
              <Select value={selectedBoar} onValueChange={setSelectedBoar}>
                <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Choose a boar" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  {availableBoars.map((boar) => (
                    <SelectItem key={boar.id} value={boar.id || ''}>
                      {boar.name} ({boar.hutch_name || 'N/A'}) - {boar.breed} {!utils.isPigMature(boar).isMature ? '(Too Young)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedSow && selectedBoar && !isLoading && (
            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60">
              {(() => {
                const compatibility = getBreedingCompatibility(
                  selectedSow,
                  selectedBoar
                );
                return (
                  <div className="flex items-center space-x-3">
                    {compatibility.compatible ? (
                      <Badge
                        variant="default"
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white"
                      >
                        Compatible
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="bg-gradient-to-r from-red-500 to-red-600"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Not Compatible
                      </Badge>
                    )}
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {compatibility.reason}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          <Button
            className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white"
            disabled={!selectedSow || !selectedBoar || isLoading}
            onClick={handleScheduleBreeding}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isLoading ? "Scheduling..." : "Schedule Breeding"}
          </Button>

          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-500 text-sm">{success}</div>}
        </CardContent>
      </Card>

      {/* Pregnant Sows */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">
            Pregnant Sows - Expected Births
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pregnantSows.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                No pregnant sows at the moment.
              </p>
            ) : (
              pregnantSows.map(sow => (
                <div
                  key={sow.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gradient-to-r from-pink-50/80 to-pink-100/80 dark:from-pink-900/30 dark:to-pink-800/30"
                >
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {sow.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Hutch {utils.hutchNamesConversion(hutches, sow.hutch_id ?? '') || "N/A"}
                      {/* • Mated with {sow.mated_with} */}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Mating Date:{" "}
                      {sow.pregnancy_start_date
                        ? new Date(
                          sow.pregnancy_start_date
                        ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {sow.expected_birth_date
                        ? new Date(sow.expected_birth_date).toLocaleDateString()
                        : "TBD"}
                    </p>
                    <Badge
                      variant="outline"
                      className="bg-white/50 dark:bg-gray-800/50 border-pink-200 dark:border-pink-700 text-pink-800 dark:text-pink-300"
                    >
                      {sow.expected_birth_date
                        ? `${Math.ceil(
                          (new Date(sow.expected_birth_date).getTime() -
                            new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                        )} days`
                        : "TBD"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Breeding History */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">
            Recent Breeding History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingRecords ? (
            <p className="text-gray-600 dark:text-gray-400">
              Loading breeding records...
            </p>
          ) : breedingRecords.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">
              No breeding records found.
            </p>
          ) : (
            <div className="space-y-3">
              {breedingRecords
                .sort(
                  (a, b) =>
                    new Date(b.mating_date).getTime() -
                    new Date(a.mating_date).getTime()
                )
                .slice(0, 5)
                .map(record => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {record.sow_id} × {record.boar_id}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(record.mating_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={record.is_pregnant ? "default" : "outline"}
                      className={
                        record.is_pregnant
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                          : "bg-white/50 dark:bg-green-800/50"
                      }
                    >
                      {record.is_pregnant ? "Pregnant" : "Completed"}
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}