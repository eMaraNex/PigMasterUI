"use client";

import { Moon, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CurrencySelector from "@/components/currency-selector";
import { useTheme } from "@/lib/theme-context";

/** Display preferences stored on this device. */
export default function PreferencesSettings() {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ] as const;

  return (
    <Card className="bg-white/80 dark:bg-gray-800/70">
      <CardHeader>
        <CardTitle className="text-base">Display</CardTitle>
        <p className="text-sm text-gray-500">How amounts and the app look on this device.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium">Display currency</p>
          <p className="text-xs text-gray-500">Amounts are converted from your farm currency using daily exchange rates.</p>
          <div className="max-w-xs"><CurrencySelector /></div>
        </div>
        {(
          <div className="space-y-2">
            <p className="text-sm font-medium">Theme</p>
            <div className="grid max-w-xs grid-cols-2 gap-2">
              {options.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 ${
                    theme === option.value ? "border-blue-500 ring-2 ring-blue-500/30" : ""
                  }`}
                >
                  <option.icon className="h-5 w-5" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
