"use client";

import { useEffect, useState } from "react";
import { Loader2, Locate, MapPin, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";
import { usePermissions } from "@/lib/permissions";
import { useCurrency } from "@/lib/currency-context";
import { api, useGetFarmQuery } from "@/lib/redux/api";
import { useAppDispatch } from "@/lib/redux/hooks";
import { useToast } from "@/lib/toast-provider";
import * as utils from "@/lib/utils";

type FarmForm = { name: string; location: string; latitude: string; longitude: string; size: string; currency: string; description: string };

/** Farm profile. Only the owner can change it (the API enforces this too). */
export default function FarmSettings() {
  const { user } = useAuth();
  const { isOwner } = usePermissions();
  const { supportedCurrencies } = useCurrency();
  const dispatch = useAppDispatch();
  const { showSuccess, showError } = useToast();
  const { data: farm, isLoading } = useGetFarmQuery(user?.farm_id ?? "", { skip: !user?.farm_id });
  const [form, setForm] = useState<FarmForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!farm) return;
    setForm({
      name: String(farm.name ?? ""),
      location: String(farm.location ?? ""),
      latitude: farm.latitude != null ? String(farm.latitude) : "",
      longitude: farm.longitude != null ? String(farm.longitude) : "",
      size: farm.size != null ? String(farm.size) : "",
      currency: String(farm.currency ?? "KES"),
      description: String(farm.description ?? ""),
    });
  }, [farm]);

  if (isLoading || !form) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;

  const set = (key: keyof FarmForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: event.target.value });

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const { latitude, longitude } = await utils.getCurrentLocation();
      const address = await utils.getAddressFromCoordinates(latitude, longitude).catch(() => form.location);
      setForm({ ...form, latitude: latitude.toFixed(6), longitude: longitude.toFixed(6), location: address || form.location });
    } catch (error: any) {
      showError("Location unavailable", error?.message ?? "Allow location access and try again.");
    } finally {
      setLocating(false);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await apiRequest.patch(`/farms/update/${farm!.id}`, {
        name: form.name,
        location: form.location || null,
        latitude: form.latitude === "" ? null : Number(form.latitude),
        longitude: form.longitude === "" ? null : Number(form.longitude),
        size: form.size === "" ? null : Number(form.size),
        currency: form.currency,
        description: form.description || null,
      });
      dispatch(api.util.invalidateTags(["Farm", "CurrentUser"]));
      showSuccess("Farm details saved");
    } catch (error: any) {
      showError("Could not save", error?.response?.data?.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-white/80 dark:bg-gray-800/70">
      <CardHeader>
        <CardTitle className="text-base">Farm details</CardTitle>
        <p className="text-sm text-gray-500">
          {isOwner ? "Shown on reports and used to place your farm on the map." : "Only the farm owner can change these details."}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-5">
          <fieldset disabled={!isOwner} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="farm-name">Farm name</Label>
              <Input id="farm-name" required value={form.name} onChange={set("name")} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="farm-location">Location</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input id="farm-location" className="pl-9" placeholder="Town, county or address" value={form.location} onChange={set("location")} />
                </div>
                <Button type="button" variant="outline" onClick={useMyLocation} disabled={locating}>
                  {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
                  <span className="ml-2 hidden sm:inline">Use my location</span>
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="farm-lat">Latitude</Label>
              <Input id="farm-lat" type="number" step="0.000001" min={-90} max={90} value={form.latitude} onChange={set("latitude")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="farm-lng">Longitude</Label>
              <Input id="farm-lng" type="number" step="0.000001" min={-180} max={180} value={form.longitude} onChange={set("longitude")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="farm-size">Size (acres)</Label>
              <Input id="farm-size" type="number" min={0} step="0.01" value={form.size} onChange={set("size")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="farm-currency">Farm currency</Label>
              <select id="farm-currency" value={form.currency} onChange={set("currency")} className="h-10 w-full rounded-md border bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900">
                {(supportedCurrencies.length ? supportedCurrencies : [form.currency]).map(code => <option key={code} value={code}>{code}</option>)}
              </select>
              <p className="text-xs text-gray-500">Prices and sales are recorded in this currency.</p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="farm-description">Description</Label>
              <Textarea id="farm-description" rows={3} value={form.description} onChange={set("description")} />
            </div>
          </fieldset>
          {isOwner && (
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save changes
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
