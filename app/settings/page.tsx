"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Bell,
    Mail,
    MessageSquare,
    Calendar,
    Heart,
    Baby,
    Utensils,
    Shield,
    Database,
    Crown,
    ArrowLeft,
} from "lucide-react"
import ProtectedRoute from "@/components/auth/protected-route"
import { useRouter } from "next/navigation"
import { useSubscription } from "@/lib/subscription-context"

interface NotificationSetting {
    id: string
    name: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    channels: {
        email: boolean
        sms: boolean
        push: boolean
    }
    enabled: boolean
    premium?: boolean
}

function SettingsContent() {
    const router = useRouter()
    const { tier, isFeatureAvailable } = useSubscription()
    const [loading, setLoading] = useState(false)

    const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
        {
            id: "birth_reminders",
            name: "Birth Reminders",
            description: "Get notified when pigs are due to give birth",
            icon: Baby,
            channels: { email: true, sms: false, push: true },
            enabled: true,
        },
        {
            id: "breeding_reminders",
            name: "Breeding Reminders",
            description: "Reminders for optimal breeding times",
            icon: Heart,
            channels: { email: true, sms: false, push: true },
            enabled: true,
        },
        {
            id: "health_alerts",
            name: "Health Alerts",
            description: "Important health notifications and vaccination reminders",
            icon: Shield,
            channels: { email: true, sms: true, push: true },
            enabled: true,
            premium: true,
        },
        {
            id: "feeding_alerts",
            name: "Feeding Alerts",
            description: "Feeding schedule reminders and nutrition alerts",
            icon: Utensils,
            channels: { email: false, sms: false, push: true },
            enabled: true,
        },
        {
            id: "backup_notifications",
            name: "Backup Notifications",
            description: "Data backup completion and status updates",
            icon: Database,
            channels: { email: true, sms: false, push: false },
            enabled: false,
            premium: true,
        },
        {
            id: "calendar_sync",
            name: "Calendar Integration",
            description: "Sync events with Google Calendar",
            icon: Calendar,
            channels: { email: false, sms: false, push: false },
            enabled: false,
            premium: true,
        },
    ])

    const [deliverySettings, setDeliverySettings] = useState({
        email: {
            enabled: true,
            address: "user@example.com",
            frequency: "immediate",
        },
        sms: {
            enabled: isFeatureAvailable("sms_notifications"),
            phone: "+1234567890",
            frequency: "immediate",
        },
        push: {
            enabled: true,
            frequency: "immediate",
        },
    })

    const updateNotificationSetting = (id: string, field: string, value: any) => {
        setNotificationSettings((prev) =>
            prev.map((setting) =>
                setting.id === id
                    ? {
                        ...setting,
                        [field]:
                            typeof setting[field as keyof NotificationSetting] === "object" && setting[field as keyof NotificationSetting] !== null
                                ? { ...(setting[field as keyof NotificationSetting] as object), ...value }
                                : value,
                    }
                    : setting,
            ),
        )
    }

    const handleSaveSettings = async () => {
        setLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        console.log("Saving notification settings:", { notificationSettings, deliverySettings })
        setLoading(false)
    }

    const isPremiumFeature = (setting: NotificationSetting) => {
        return setting.premium && !isFeatureAvailable("email_notifications")
    }

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between mb-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="p-2 touch:p-3 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span className="ml-2 hidden sm:inline">Back</span>
                    </Button>
                    <div className="text-center">
                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Settings
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
                            Configure notifications and preferences
                        </p>
                    </div>
                    <div className="w-8 sm:w-10" /> {/* Spacer for alignment */}
                </div>

                <Tabs defaultValue="alerts" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg overflow-x-auto border-gray-200 dark:border-gray-700">
                        <TabsTrigger
                            value="alerts"
                            className="text-xs sm:text-sm py-3 touch:py-4 text-gray-700 dark:text-gray-200"
                        >
                            Alert Types
                        </TabsTrigger>
                        <TabsTrigger
                            value="delivery"
                            className="text-xs sm:text-sm py-3 touch:py-4 text-gray-700 dark:text-gray-200"
                        >
                            Delivery Methods
                        </TabsTrigger>
                    </TabsList>

                    {/* Alert Types Tab */}
                    <TabsContent value="alerts" className="space-y-4">
                        <div className="grid gap-4">
                            {notificationSettings.map((setting) => {
                                const Icon = setting.icon
                                const isLocked = isPremiumFeature(setting)

                                return (
                                    <Card
                                        key={setting.id}
                                        className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl ${isLocked ? "opacity-60" : ""}`}
                                    >
                                        <CardContent className="p-4 sm:p-6">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                                                <div className="flex items-start space-x-4 flex-1">
                                                    <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-gray-100">{setting.name}</h3>
                                                            {setting.premium && (
                                                                <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs sm:text-sm">
                                                                    <Crown className="h-3 w-3 mr-1" />
                                                                    Premium
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3">{setting.description}</p>

                                                        {/* Channel toggles */}
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-2">
                                                                    <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                                                    <Label className="text-sm sm:text-base text-gray-700 dark:text-gray-200">Email</Label>
                                                                </div>
                                                                <Switch
                                                                    checked={setting.channels.email && !isLocked}
                                                                    disabled={isLocked}
                                                                    onCheckedChange={(checked) =>
                                                                        updateNotificationSetting(setting.id, "channels", { email: checked })
                                                                    }
                                                                    className="scale-110 touch:scale-125"
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-2">
                                                                    <MessageSquare className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                                                    <Label className="text-sm sm:text-base text-gray-700 dark:text-gray-200">SMS</Label>
                                                                    {!isFeatureAvailable("sms_notifications") && (
                                                                        <Badge variant="outline" className="text-xs border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">
                                                                            Premium
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <Switch
                                                                    checked={setting.channels.sms && isFeatureAvailable("sms_notifications") && !isLocked}
                                                                    disabled={!isFeatureAvailable("sms_notifications") || isLocked}
                                                                    onCheckedChange={(checked) =>
                                                                        updateNotificationSetting(setting.id, "channels", { sms: checked })
                                                                    }
                                                                    className="scale-110 touch:scale-125"
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-2">
                                                                    <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                                                    <Label className="text-sm sm:text-base text-gray-700 dark:text-gray-200">Push</Label>
                                                                </div>
                                                                <Switch
                                                                    checked={setting.channels.push && !isLocked}
                                                                    disabled={isLocked}
                                                                    onCheckedChange={(checked) =>
                                                                        updateNotificationSetting(setting.id, "channels", { push: checked })
                                                                    }
                                                                    className="scale-110 touch:scale-125"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="ml-0 sm:ml-4 self-center sm:self-start">
                                                    <Switch
                                                        checked={setting.enabled && !isLocked}
                                                        disabled={isLocked}
                                                        onCheckedChange={(checked) => updateNotificationSetting(setting.id, "enabled", checked)}
                                                        className="scale-110 touch:scale-125"
                                                    />
                                                </div>
                                            </div>
                                            {isLocked && (
                                                <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                                    <p className="text-sm text-purple-700 dark:text-purple-300">
                                                        This feature is available in Standard and Advanced plans.{" "}
                                                        <Button
                                                            variant="link"
                                                            className="p-0 h-auto text-purple-700 dark:text-purple-300 text-sm"
                                                            onClick={() => router.push("/pricing")}
                                                        >
                                                            Upgrade now
                                                        </Button>
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </TabsContent>

                    {/* Delivery Methods Tab */}
                    <TabsContent value="delivery" className="space-y-4">
                        <div className="grid gap-4">
                            {/* Email Settings */}
                            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl text-gray-900 dark:text-gray-100">
                                        <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        <span>Email Notifications</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm sm:text-base text-gray-700 dark:text-gray-200">Enable Email Notifications</Label>
                                        <Switch
                                            checked={deliverySettings.email.enabled}
                                            onCheckedChange={(checked) =>
                                                setDeliverySettings({
                                                    ...deliverySettings,
                                                    email: { ...deliverySettings.email, enabled: checked },
                                                })
                                            }
                                            className="scale-110 touch:scale-125"
                                        />
                                    </div>
                                    {deliverySettings.email.enabled && (
                                        <div className="space-y-4 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                                            <div className="space-y-2">
                                                <Label className="text-sm sm:text-base text-gray-700 dark:text-gray-200">Email Address</Label>
                                                <input
                                                    type="email"
                                                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-md text-sm sm:text-base h-12 touch:h-14 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                                    value={deliverySettings.email.address}
                                                    onChange={(e) =>
                                                        setDeliverySettings({
                                                            ...deliverySettings,
                                                            email: { ...deliverySettings.email, address: e.target.value },
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm sm:text-base text-gray-700 dark:text-gray-200">Frequency</Label>
                                                <select
                                                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-md text-sm sm:text-base h-12 touch:h-14 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                                    value={deliverySettings.email.frequency}
                                                    onChange={(e) =>
                                                        setDeliverySettings({
                                                            ...deliverySettings,
                                                            email: { ...deliverySettings.email, frequency: e.target.value },
                                                        })
                                                    }
                                                >
                                                    <option value="immediate">Immediate</option>
                                                    <option value="daily">Daily Digest</option>
                                                    <option value="weekly">Weekly Summary</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* SMS Settings */}
                            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl text-gray-900 dark:text-gray-100">
                                        <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        <span>SMS Notifications</span>
                                        {!isFeatureAvailable("sms_notifications") && <Badge variant="outline" className="text-xs sm:text-sm border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">Premium Feature</Badge>}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm sm:text-base text-gray-700 dark:text-gray-200">Enable SMS Notifications</Label>
                                        <Switch
                                            checked={deliverySettings.sms.enabled && isFeatureAvailable("sms_notifications")}
                                            disabled={!isFeatureAvailable("sms_notifications")}
                                            onCheckedChange={(checked) =>
                                                setDeliverySettings({
                                                    ...deliverySettings,
                                                    sms: { ...deliverySettings.sms, enabled: checked },
                                                })
                                            }
                                            className="scale-110 touch:scale-125"
                                        />
                                    </div>
                                    {deliverySettings.sms.enabled && isFeatureAvailable("sms_notifications") && (
                                        <div className="space-y-4 pl-4 border-l-2 border-green-200 dark:border-green-800">
                                            <div className="space-y-2">
                                                <Label className="text-sm sm:text-base text-gray-700 dark:text-gray-200">Phone Number</Label>
                                                <input
                                                    type="tel"
                                                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-md text-sm sm:text-base h-12 touch:h-14 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                                    value={deliverySettings.sms.phone}
                                                    onChange={(e) =>
                                                        setDeliverySettings({
                                                            ...deliverySettings,
                                                            sms: { ...deliverySettings.sms, phone: e.target.value },
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm sm:text-base text-gray-700 dark:text-gray-200">Frequency</Label>
                                                <select
                                                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-md text-sm sm:text-base h-12 touch:h-14 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                                    value={deliverySettings.sms.frequency}
                                                    onChange={(e) =>
                                                        setDeliverySettings({
                                                            ...deliverySettings,
                                                            sms: { ...deliverySettings.sms, frequency: e.target.value },
                                                        })
                                                    }
                                                >
                                                    <option value="immediate">Immediate</option>
                                                    <option value="daily">Daily Summary</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                    {!isFeatureAvailable("sms_notifications") && (
                                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                            <p className="text-sm text-purple-700 dark:text-purple-300">
                                                SMS notifications are available in Advanced plan.{" "}
                                                <Button
                                                    variant="link"
                                                    className="p-0 h-auto text-purple-700 dark:text-purple-300 text-sm"
                                                    onClick={() => router.push("/pricing")}
                                                >
                                                    Upgrade now
                                                </Button>
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Push Notifications */}
                            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl text-gray-900 dark:text-gray-100">
                                        <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                        <span>Push Notifications</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm sm:text-base text-gray-700 dark:text-gray-200">Enable Push Notifications</Label>
                                        <Switch
                                            checked={deliverySettings.push.enabled}
                                            onCheckedChange={(checked) =>
                                                setDeliverySettings({
                                                    ...deliverySettings,
                                                    push: { ...deliverySettings.push, enabled: checked },
                                                })
                                            }
                                            className="scale-110 touch:scale-125"
                                        />
                                    </div>
                                    {deliverySettings.push.enabled && (
                                        <div className="space-y-4 pl-4 border-l-2 border-orange-200 dark:border-orange-800">
                                            <div className="space-y-2">
                                                <Label className="text-sm sm:text-base text-gray-700 dark:text-gray-200">Frequency</Label>
                                                <select
                                                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-md text-sm sm:text-base h-12 touch:h-14 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                                    value={deliverySettings.push.frequency}
                                                    onChange={(e) =>
                                                        setDeliverySettings({
                                                            ...deliverySettings,
                                                            push: { ...deliverySettings.push, frequency: e.target.value },
                                                        })
                                                    }
                                                >
                                                    <option value="immediate">Immediate</option>
                                                    <option value="daily">Daily Summary</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Save Button */}
                <div className="flex justify-center">
                    <Button
                        onClick={handleSaveSettings}
                        disabled={loading}
                        size="lg"
                        className="w-full sm:w-auto px-8 text-base h-12 touch:h-14 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                    >
                        {loading ? "Saving..." : "Save Settings"}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default function SettingsPage() {
    return (
        <ProtectedRoute>
            <SettingsContent />
        </ProtectedRoute>
    )
}