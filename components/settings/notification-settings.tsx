"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Mail, MessageSquare, Calendar, Heart, Baby, Utensils, Shield, Database, Crown } from "lucide-react"
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

export default function NotificationSettings() {
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
            frequency: "immediate", // immediate, daily, weekly
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
                            typeof value === "object" &&
                                setting[field as keyof NotificationSetting] &&
                                typeof setting[field as keyof NotificationSetting] === "object"
                                ? {
                                    ...(typeof setting[field as keyof NotificationSetting] === "object"
                                        ? (setting[field as keyof NotificationSetting] as object)
                                        : {}),
                                    ...value,
                                }
                                : value,
                    }
                    : setting,
            ),
        )
    }

    const handleSaveSettings = async () => {
        setLoading(true)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))
        console.log("Saving notification settings:", { notificationSettings, deliverySettings })
        setLoading(false)
    }

    const isPremiumFeature = (setting: NotificationSetting) => {
        return setting.premium && !isFeatureAvailable("email_notifications")
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 p-6">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Notification Settings
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                        Configure how and when you want to receive alerts and reminders
                    </p>
                </div>

                <Tabs defaultValue="alerts" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg">
                        <TabsTrigger value="alerts">Alert Types</TabsTrigger>
                        <TabsTrigger value="delivery">Delivery Methods</TabsTrigger>
                    </TabsList>

                    {/* Alert Types Tab */}
                    <TabsContent value="alerts" className="space-y-6">
                        <div className="grid gap-6">
                            {notificationSettings.map((setting) => {
                                const Icon = setting.icon
                                const isLocked = isPremiumFeature(setting)

                                return (
                                    <Card
                                        key={setting.id}
                                        className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl ${isLocked ? "opacity-60" : ""
                                            }`}
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-4 flex-1">
                                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                        <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <h3 className="font-semibold text-lg">{setting.name}</h3>
                                                            {setting.premium && (
                                                                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                                                    <Crown className="h-3 w-3 mr-1" />
                                                                    Premium
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-gray-600 dark:text-gray-300 mb-4">{setting.description}</p>

                                                        {/* Channel toggles */}
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-2">
                                                                    <Mail className="h-4 w-4 text-gray-500" />
                                                                    <Label>Email</Label>
                                                                </div>
                                                                <Switch
                                                                    checked={setting.channels.email && !isLocked}
                                                                    disabled={isLocked}
                                                                    onCheckedChange={(checked) =>
                                                                        updateNotificationSetting(setting.id, "channels", { email: checked })
                                                                    }
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-2">
                                                                    <MessageSquare className="h-4 w-4 text-gray-500" />
                                                                    <Label>SMS</Label>
                                                                    {!isFeatureAvailable("sms_notifications") && (
                                                                        <Badge variant="outline" className="text-xs">
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
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-2">
                                                                    <Bell className="h-4 w-4 text-gray-500" />
                                                                    <Label>Push Notifications</Label>
                                                                </div>
                                                                <Switch
                                                                    checked={setting.channels.push && !isLocked}
                                                                    disabled={isLocked}
                                                                    onCheckedChange={(checked) =>
                                                                        updateNotificationSetting(setting.id, "channels", { push: checked })
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <Switch
                                                        checked={setting.enabled && !isLocked}
                                                        disabled={isLocked}
                                                        onCheckedChange={(checked) => updateNotificationSetting(setting.id, "enabled", checked)}
                                                    />
                                                </div>
                                            </div>
                                            {isLocked && (
                                                <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                                    <p className="text-sm text-purple-700 dark:text-purple-300">
                                                        This feature is available in Standard and Advanced plans.{" "}
                                                        <Button variant="link" className="p-0 h-auto text-purple-700 dark:text-purple-300">
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
                    <TabsContent value="delivery" className="space-y-6">
                        <div className="grid gap-6">
                            {/* Email Settings */}
                            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Mail className="h-5 w-5" />
                                        <span>Email Notifications</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label>Enable Email Notifications</Label>
                                        <Switch
                                            checked={deliverySettings.email.enabled}
                                            onCheckedChange={(checked) =>
                                                setDeliverySettings({
                                                    ...deliverySettings,
                                                    email: { ...deliverySettings.email, enabled: checked },
                                                })
                                            }
                                        />
                                    </div>
                                    {deliverySettings.email.enabled && (
                                        <div className="space-y-4 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                                            <div className="space-y-2">
                                                <Label>Email Address</Label>
                                                <input
                                                    type="email"
                                                    className="w-full p-2 border rounded-md"
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
                                                <Label>Frequency</Label>
                                                <select
                                                    className="w-full p-2 border rounded-md"
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
                                    <CardTitle className="flex items-center space-x-2">
                                        <MessageSquare className="h-5 w-5" />
                                        <span>SMS Notifications</span>
                                        {!isFeatureAvailable("sms_notifications") && <Badge variant="outline">Premium Feature</Badge>}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label>Enable SMS Notifications</Label>
                                        <Switch
                                            checked={deliverySettings.sms.enabled && isFeatureAvailable("sms_notifications")}
                                            disabled={!isFeatureAvailable("sms_notifications")}
                                            onCheckedChange={(checked) =>
                                                setDeliverySettings({
                                                    ...deliverySettings,
                                                    sms: { ...deliverySettings.sms, enabled: checked },
                                                })
                                            }
                                        />
                                    </div>
                                    {deliverySettings.sms.enabled && isFeatureAvailable("sms_notifications") && (
                                        <div className="space-y-4 pl-4 border-l-2 border-green-200 dark:border-green-800">
                                            <div className="space-y-2">
                                                <Label>Phone Number</Label>
                                                <input
                                                    type="tel"
                                                    className="w-full p-2 border rounded-md"
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
                                                <Label>Frequency</Label>
                                                <select
                                                    className="w-full p-2 border rounded-md"
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
                                                <Button variant="link" className="p-0 h-auto text-purple-700 dark:text-purple-300">
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
                                    <CardTitle className="flex items-center space-x-2">
                                        <Bell className="h-5 w-5" />
                                        <span>Push Notifications</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label>Enable Push Notifications</Label>
                                        <Switch
                                            checked={deliverySettings.push.enabled}
                                            onCheckedChange={(checked) =>
                                                setDeliverySettings({
                                                    ...deliverySettings,
                                                    push: { ...deliverySettings.push, enabled: checked },
                                                })
                                            }
                                        />
                                    </div>
                                    {deliverySettings.push.enabled && (
                                        <div className="space-y-4 pl-4 border-l-2 border-orange-200 dark:border-orange-800">
                                            <div className="space-y-2">
                                                <Label>Frequency</Label>
                                                <select
                                                    className="w-full p-2 border rounded-md"
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
                    <Button onClick={handleSaveSettings} disabled={loading} size="lg" className="px-8">
                        {loading ? "Saving..." : "Save Settings"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
