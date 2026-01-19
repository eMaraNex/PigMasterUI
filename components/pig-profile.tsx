"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Heart, Pill, Utensils, Edit, Circle, ArrowRightLeft } from "lucide-react";
import axios from "axios";
import * as utils from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import type { HealthRecord, PigProfileProps, Pig as PigType } from "@/types";
import EditPigDialog from "./edit-pig-dialog";
import TransferPigDialog from "./transfer-pig-dialog";
import PigTransferHistory from "./pig-transfer-history";
import { useToast } from "@/lib/toast-provider";

export default function PigProfile({ pig, onClose, onTransferComplete }: PigProfileProps & { onTransferComplete?: () => void }) {
  const { user } = useAuth();
  const [pigData, setPigData] = useState<PigType | null>(pig);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [pens, setPens] = useState<any[]>([]);
  const { showError } = useToast();

  const calculateAge = (birth_date: string): number => {
    const birth = new Date(birth_date);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    return months;
  };

  useEffect(() => {
    const fetchPig = async () => {
      if (!user?.farm_id || !pig.id) {
        showError('Error', "Missing farm ID or pig ID. Please try again.")
        setLoading(false);
        return;
      }
      if (pig && pig.name && pig.breed && pig.pen_name) {
        setPigData(pig);
        setLoading(false);
        // Load pens for transfer dialog
        loadPens();
        return;
      }
      setLoading(true);
      try {
        const token = localStorage.getItem("pig_farm_token");
        if (!token) {
          showError('Error', "No authentication token found")
        }

        // Try localStorage first
        const cachedPigs = localStorage.getItem(`pig_farm_pigs_${user.farm_id}`);
        if (cachedPigs) {
          const pigs: PigType[] = JSON.parse(cachedPigs);
          const cachedPig = pigs.find((r: PigType) => r.id === pig.id);
          if (cachedPig) {
            setPigData(cachedPig);
            setLoading(false);
            loadPens();
            return;
          }
        }

        // Fetch from API
        const response = await axios.get(`${utils.apiUrl}/pigs/${pig.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { farm_id: user.farm_id },
        });

        if (response.data.success) {
          setPigData(response.data.data);
          // Update localStorage
          const cachedPigs = JSON.parse(localStorage.getItem(`pig_farm_pigs_${user.farm_id}`) || "[]") as PigType[];
          const updatedPigs = cachedPigs.filter((r: PigType) => r.id !== pig.id).concat(response.data.data);
          localStorage.setItem(`pig_farm_pigs_${user.farm_id}`, JSON.stringify(updatedPigs));
          loadPens();
        } else {
          showError('Error', "Failed to fetch pig data")
        }
      } catch (err: any) {
        showError('Error', err.response?.data?.message)
      } finally {
        setLoading(false);
      }
    };

    fetchPig();
  }, [pig, user]);

  const loadPens = async () => {
    try {
      const token = localStorage.getItem("pig_farm_token");
      if (!token || !user?.farm_id) return;

      // Try localStorage first
      const cachedPens = localStorage.getItem(`pig_farm_pens_${user.farm_id}`);
      if (cachedPens) {
        setPens(JSON.parse(cachedPens));
        return;
      }

      // Fetch from API
      const response = await axios.get(`${utils.apiUrl}/pens/${user.farm_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setPens(response.data.data || []);
      }
    } catch (error) {
      console.error("Error loading pens:", error);
    }
  };

  const handleUpdatePig = (updatedPig: PigType) => {
    setPigData(updatedPig);
    setIsEditDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="text-center">
          <Circle className="h-12 w-12 mx-auto text-green-600 dark:text-green-400 animate-bounce mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading Pig Profile...</p>
        </div>
      </div>
    );
  }

  if (error || !pigData) {
    return (
      <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md bg-white/95 dark:bg-gray-800/95">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">{error || "Pig not found"}</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-white/20 dark:border-gray-600/20 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-green-50/80 to-blue-50/80 dark:from-green-900/30 dark:to-blue-900/30 border-b border-gray-200 dark:border-gray-600">
            <CardTitle className="flex items-center space-x-3">
              <span className="text-gray-900 dark:text-gray-100">{pigData.name}</span>
              <Badge
                variant={pigData.gender === "female" ? "default" : "secondary"}
                className={
                  pigData.gender === "female"
                    ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                }
              >
                {pigData.gender === "female" ? "Sow" : "Boar"}
              </Badge>
              {pigData.is_pregnant && (
                <Badge
                  variant="outline"
                  className="bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-700 text-pink-800 dark:text-pink-300"
                >
                  Pregnant
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
              <Card className="bg-gradient-to-br from-blue-50/80 to-blue-100/80 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-800 dark:text-blue-300">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Pen:</span>
                    <span className="text-gray-700 dark:text-gray-300">{pigData.pen_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Breed:</span>
                    <span className="text-gray-700 dark:text-gray-300">{pigData.breed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Color:</span>
                    <span className="text-gray-700 dark:text-gray-300">{pigData.color}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Birth Date:</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {new Date(pigData.birth_date ?? '').toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Age:</span>
                    <span className="text-gray-700 dark:text-gray-300">{calculateAge(pigData.birth_date ?? '')} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Weight:</span>
                    <span className="text-gray-700 dark:text-gray-300">{pigData.weight} kg</span>
                  </div>
                  {pigData.status && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Status:</span>
                      <span className="text-gray-700 dark:text-gray-300">{pigData.status}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-50/80 to-pink-100/80 dark:from-pink-900/30 dark:to-pink-800/30 border-pink-200 dark:border-pink-700">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                    <span className="text-pink-800 dark:text-pink-300">Breeding Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pigData.last_mating_date && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Last Mating:</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {new Date(pigData.last_mating_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {pigData.mated_with && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Mated With:</span>
                      <span className="text-gray-700 dark:text-gray-300">{pigData.mated_with}</span>
                    </div>
                  )}
                  {pigData.pregnancy_start_date && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Pregnancy Start:</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {new Date(pigData.pregnancy_start_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {pigData.expected_birth_date && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Expected Birth:</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {new Date(pigData.expected_birth_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {pigData.actual_birth_date && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Actual Birth:</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {new Date(pigData.actual_birth_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Total Litters:</span>
                    <span className="text-gray-700 dark:text-gray-300">{pigData.total_litters || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Total Piglets:</span>
                    <span className="text-gray-700 dark:text-gray-300">{pigData.total_piglets || 0}</span>
                  </div>
                  {pigData.parent_male_id && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Father:</span>
                      <span className="text-gray-700 dark:text-gray-300">{pigData.parent_male_id}</span>
                    </div>
                  )}
                  {pigData.parent_female_id && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Mother:</span>
                      <span className="text-gray-700 dark:text-gray-300">{pigData.parent_female_id}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-br from-green-50/80 to-green-100/80 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Pill className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-green-800 dark:text-green-300">Health Records</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pigData.healthRecords && pigData.healthRecords.length > 0 ? (
                    pigData.healthRecords.map((record: HealthRecord, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-white/60 dark:bg-gray-700/60 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{record.type}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{record.description}</p>
                          {record.veterinarian && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Veterinarian: {record.veterinarian}
                            </p>
                          )}
                          {record.notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">Notes: {record.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {new Date(record.date).toLocaleDateString()}
                          </p>
                          {record.nextDue && (
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              Next Due: {new Date(record.nextDue).toLocaleDateString()}
                            </p>
                          )}
                          <Badge
                            variant="outline"
                            className="mt-1 text-xs bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300"
                          >
                            {record.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 dark:text-gray-400">No health records available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50/80 to-yellow-100/80 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-200 dark:border-yellow-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Utensils className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-yellow-800 dark:text-yellow-300">Feeding Schedule</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pigData.feedingSchedule ? (
                    <div className="p-3 bg-white/60 dark:bg-gray-700/60 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-900 dark:text-gray-100">Daily Amount:</span>
                          <span className="text-gray-700 dark:text-gray-300">{pigData.feedingSchedule.dailyAmount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-900 dark:text-gray-100">Feed Type:</span>
                          <span className="text-gray-700 dark:text-gray-300">{pigData.feedingSchedule.feedType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-900 dark:text-gray-100">Feeding Times:</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {pigData.feedingSchedule.times.join(", ")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-900 dark:text-gray-100">Last Fed:</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {new Date(pigData.feedingSchedule.lastFed).toLocaleString()}
                          </span>
                        </div>
                        {pigData.feedingSchedule.specialDiet && (
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-900 dark:text-gray-100">Special Diet:</span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {pigData.feedingSchedule.specialDiet}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 dark:text-gray-400">No feeding schedule available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <Button
                variant="outline"
                onClick={() => setIsTransferDialogOpen(true)}
                className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-amber-100 dark:hover:bg-amber-900/30"
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transfer Pig
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(true)}
                className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                Close
              </Button>
            </div>

            {/* Transfer History Section */}
            {pigData?.pig_id && user?.farm_id && (
              <PigTransferHistory pigId={pigData.pig_id} farmId={user.farm_id} />
            )}
          </CardContent>
        </Card>
      </div>
      {isEditDialogOpen && (
        <EditPigDialog
          pig={pigData}
          onClose={() => setIsEditDialogOpen(false)}
          onUpdate={handleUpdatePig}
        />
      )}
      {isTransferDialogOpen && pigData && user?.farm_id && (
        <TransferPigDialog
          isOpen={isTransferDialogOpen}
          onClose={() => setIsTransferDialogOpen(false)}
          pigId={pigData.pig_id!}
          pigName={(pigData.name || pigData.pig_id)!}
          farmId={user.farm_id}
          currentPenId={pigData.pen_id}
          currentPenName={pigData.pen_name}
          pens={pens}
          onTransferSuccess={() => {
            // Call the parent's refresh function if provided
            if (onTransferComplete) {
              onTransferComplete();
            }
          }}
        />
      )}
    </>
  );
}