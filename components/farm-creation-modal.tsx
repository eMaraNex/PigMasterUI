"use client";

import type React from "react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import axios from "axios";
import { useAuth } from "@/lib/auth-context";
import * as utils from "@/lib/utils";
import { MapPin, Building, Ruler, Globe, Clock, Locate, Check, ChevronsUpDown } from "lucide-react";
import type { FarmCreationModalProps } from "@/types/farms";
import { timezones, breeds, colors } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useToast } from '@/lib/toast-provider';

const FarmCreationModal: React.FC<FarmCreationModalProps> = ({ isOpen, onClose, onFarmCreated }) => {
    const { showSuccess, showError } = useToast();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        location: "",
        latitude: "",
        longitude: "",
        size: "",
        description: "",
        timezone: "UTC",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [timezoneOpen, setTimezoneOpen] = useState(false)

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = "Farm name is required";
        if (formData.latitude && (isNaN(Number(formData.latitude)) || Number(formData.latitude) < -90 || Number(formData.latitude) > 90)) {
            newErrors.latitude = "Latitude must be between -90 and 90";
        }
        if (formData.longitude && (isNaN(Number(formData.longitude)) || Number(formData.longitude) < -180 || Number(formData.longitude) > 180)) {
            newErrors.longitude = "Longitude must be between -180 and 180";
        }
        if (formData.size && (isNaN(Number(formData.size)) || Number(formData.size) <= 0)) {
            newErrors.size = "Size must be a positive number";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGetCurrentLocation = async () => {
        setIsFetchingLocation(true);
        try {
            const { latitude, longitude } = await utils.getCurrentLocation();
            const address = await utils.getAddressFromCoordinates(latitude, longitude);
            setFormData((prev) => ({
                ...prev,
                latitude: latitude.toString(),
                longitude: longitude.toString(),
                location: address,
            }));
            showSuccess('Success', "Current coordinates and address have been filled. You can edit the address manually.");
        } catch (error: any) {
            const errorMessage = error.message || "Failed to fetch current location or address. Please ensure location services are enabled.";
            setErrors((prev) => ({ ...prev, location: errorMessage }));
            showError('Error', errorMessage);
        } finally {
            setIsFetchingLocation(false);
        }
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsLoading(true);
        try {
            const token = localStorage.getItem("pig_farm_token");
            if (!token) throw new Error("No authentication token found");
            const payload = {
                name: formData.name,
                location: formData.location || undefined,
                latitude: formData.latitude ? Number(formData.latitude) : undefined,
                longitude: formData.longitude ? Number(formData.longitude) : undefined,
                size: formData.size ? Number(formData.size) : undefined,
                description: formData.description || undefined,
                timezone: formData.timezone,
                breeds: breeds ?? {},
                colors: colors ?? {},
            };

            // Clear existing farm-related local storage
            localStorage.removeItem("pig_farm_id");
            localStorage.removeItem("pig_farm_data");

            const response = await axios.post(`${utils.apiUrl}/farms`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const farmId = response.data.data.id;
            const farmData = response.data.data;

            // Set new farm data
            let filteredUserDetails;
            localStorage.setItem("pig_farm_id", farmId);
            localStorage.setItem("pig_farm_data", JSON.stringify(farmData));
            const userDetails = localStorage.getItem("pig_farm_user") ?? '';
            filteredUserDetails = JSON.parse(userDetails);

            filteredUserDetails.farm_id = farmId
            localStorage.setItem(
                "pig_farm_user",
                JSON.stringify(filteredUserDetails)
            );


            // Update user object if it exists
            if (user) {
                user.farm_id = farmId;
            }
            showSuccess('Success', `${formData.name} has been successfully created!`);
            // Reset form
            setFormData({
                id: "",
                name: "",
                location: "",
                latitude: "",
                longitude: "",
                size: "",
                description: "",
                timezone: "UTC",
            });

            // Pass farm data to parent component
            onFarmCreated();

            // Close modal
            onClose();
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                "Failed to create farm. Please try again.";
            setErrors({ submit: errorMessage });
            showError('Error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    const selectedTimezone = timezones.find((tz) => tz.zone === formData.timezone)

    return (
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent
          className="sm:max-w-[500px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-h-[80vh] overflow-y-auto"
          onInteractOutside={e => e.preventDefault()}
          onPointerDownOutside={e => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Create Your Farm
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium dark:text-gray-200 flex items-center"
              >
                <Building className="h-4 w-4 mr-2 text-green-500" />
                Farm Name <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Sunny Acres"
                className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="location"
                className="text-sm font-medium dark:text-gray-200 flex items-center"
              >
                <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={e =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="e.g., 123 Farm Road, Springfield"
                className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium dark:text-gray-200 flex items-center">
                  <Globe className="h-4 w-4 mr-2 text-purple-500" />
                  Coordinates
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGetCurrentLocation}
                  disabled={isFetchingLocation}
                  className="flex items-center dark:border-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 bg-transparent"
                >
                  <Locate className="h-4 w-4 mr-2" />
                  {isFetchingLocation ? "Fetching..." : "Use Current Location"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="latitude"
                    className="text-sm font-medium dark:text-gray-200"
                  >
                    Latitude
                  </Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={e =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                    placeholder="e.g., 40.7128"
                    className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                  />
                  {errors.latitude && (
                    <p className="text-xs text-red-500">{errors.latitude}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="longitude"
                    className="text-sm font-medium dark:text-gray-200"
                  >
                    Longitude
                  </Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={e =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                    placeholder="e.g., -74.0060"
                    className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                  />
                  {errors.longitude && (
                    <p className="text-xs text-red-500">{errors.longitude}</p>
                  )}
                </div>
              </div>
              {errors.location && (
                <p className="text-xs text-red-500">{errors.location}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="size"
                className="text-sm font-medium dark:text-gray-200 flex items-center"
              >
                <Ruler className="h-4 w-4 mr-2 text-orange-500" />
                Size (sq. meters)
              </Label>
              <Input
                id="size"
                type="number"
                step="any"
                value={formData.size}
                onChange={e =>
                  setFormData({ ...formData, size: e.target.value })
                }
                placeholder="e.g., 1000"
                className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400"
              />
              {errors.size && (
                <p className="text-xs text-red-500">{errors.size}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium dark:text-gray-200 flex items-center"
              >
                <span>Description</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="e.g., Main pig breeding farm"
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="timezone"
                className="text-sm font-medium dark:text-gray-200 flex items-center"
              >
                <Clock className="h-4 w-4 mr-2 text-teal-500" />
                Timezone
              </Label>
              <Popover open={timezoneOpen} onOpenChange={setTimezoneOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={timezoneOpen}
                    className="w-full h-12 justify-between bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <span className="truncate">
                      {selectedTimezone
                        ? `${selectedTimezone.name} - ${selectedTimezone.gmt}`
                        : "Select timezone..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 z-50"
                  side="bottom"
                  align="start"
                >
                  <Command className="bg-white dark:bg-gray-800">
                    <CommandInput
                      placeholder="Search timezone..."
                      className="h-9 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-0 focus:ring-0"
                    />
                    <CommandList className="max-h-[200px] overflow-y-auto scrollbar-thin">
                      <CommandEmpty className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        No timezone found.
                      </CommandEmpty>
                      <CommandGroup>
                        {timezones.map(timezone => (
                          <CommandItem
                            key={timezone.zone}
                            value={timezone.zone}
                            onSelect={value => {
                              setFormData({ ...formData, timezone: value });
                              setTimezoneOpen(false);
                            }}
                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1.5"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.timezone === timezone.zone
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {timezone.name}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {timezone.gmt}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {errors.submit && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-600 dark:border-red-400 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {errors.submit}
              </div>
            )}

            <DialogFooter className="flex justify-between gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose(true)}
                className="dark:border-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Skip
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
              >
                {isLoading ? "Creating..." : "Create Farm"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
};

export default FarmCreationModal;