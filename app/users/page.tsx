"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Users,
    UserPlus,
    Shield,
    Crown,
    MoreHorizontal,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    ArrowLeft,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ProtectedRoute from "@/components/auth/protected-route"
import { useRouter } from "next/navigation"
import { useSubscription } from "@/lib/subscription-context"

interface User {
    id: string
    name: string
    email: string
    role: "admin" | "manager" | "worker"
    status: "active" | "pending" | "inactive"
    avatar?: string
    joinedAt: string
    lastActive: string
}

function UsersContent() {
    const router = useRouter()
    const { tier, limits, isFeatureAvailable } = useSubscription()
    const [activeTab, setActiveTab] = useState("team")
    const [showInviteDialog, setShowInviteDialog] = useState(false)
    const [loading, setLoading] = useState(false)

    const [users, setUsers] = useState<User[]>([
        {
            id: "1",
            name: "John Doe",
            email: "john@example.com",
            role: "admin",
            status: "active",
            avatar: "/placeholder.svg",
            joinedAt: "2024-01-15",
            lastActive: "2 hours ago",
        },
        {
            id: "2",
            name: "Jane Smith",
            email: "jane@example.com",
            role: "manager",
            status: "active",
            joinedAt: "2024-02-01",
            lastActive: "1 day ago",
        },
        {
            id: "3",
            name: "Mike Johnson",
            email: "mike@example.com",
            role: "worker",
            status: "pending",
            joinedAt: "2024-03-10",
            lastActive: "Never",
        },
    ])

    const [inviteForm, setInviteForm] = useState({
        email: "",
        role: "worker" as "admin" | "manager" | "worker",
        message: "",
    })

    const handleInviteUser = async () => {
        if (!isFeatureAvailable("multiple_users")) {
            alert("Multiple users feature is only available in paid plans!")
            return
        }

        if (users.length >= limits.maxUsers) {
            alert(`You've reached the maximum number of users (${limits.maxUsers}) for your plan.`)
            return
        }

        setLoading(true)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const newUser: User = {
            id: Date.now().toString(),
            name: inviteForm.email.split("@")[0],
            email: inviteForm.email,
            role: inviteForm.role,
            status: "pending",
            joinedAt: new Date().toISOString().split("T")[0],
            lastActive: "Never",
        }

        setUsers([...users, newUser])
        setInviteForm({ email: "", role: "worker", message: "" })
        setShowInviteDialog(false)
        setLoading(false)
    }

    const handleDeleteUser = (userId: string) => {
        setUsers(users.filter((user) => user.id !== userId))
    }

    const handleUpdateUserRole = (userId: string, newRole: "admin" | "manager" | "worker") => {
        setUsers(users.map((user) => (user.id === userId ? { ...user, role: newRole } : user)))
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case "admin":
                return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
            case "manager":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
            case "worker":
                return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "active":
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case "pending":
                return <Clock className="h-4 w-4 text-yellow-500" />
            case "inactive":
                return <XCircle className="h-4 w-4 text-red-500" />
            default:
                return null
        }
    }

    const canManageUsers = isFeatureAvailable("multiple_users")

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header with Back Button */}
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" onClick={() => router.back()} className="flex items-center space-x-2">
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back</span>
                    </Button>
                    <div className="text-center flex-1">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Team Management
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 text-lg">Manage your team members and their permissions</p>
                    </div>
                </div>

                {/* Plan Limitation Warning */}
                {!canManageUsers && (
                    <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <Crown className="h-6 w-6 text-orange-600" />
                                    <div>
                                        <h3 className="font-semibold text-orange-800 dark:text-orange-300">Premium Feature</h3>
                                        <p className="text-sm text-orange-600 dark:text-orange-400">
                                            Team management is available in Standard and Advanced plans. Upgrade to invite team members.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => router.push("/pricing")}
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                    Upgrade Now
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg">
                        <TabsTrigger value="team">Team Members</TabsTrigger>
                        <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
                    </TabsList>

                    {/* Team Members Tab */}
                    <TabsContent value="team" className="space-y-6">
                        {/* Stats and Invite Button */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{users.length}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-300">Total Users</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{users.filter((u) => u.status === "active").length}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-300">Active</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{users.filter((u) => u.status === "pending").length}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-300">Pending</div>
                                </div>
                            </div>

                            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                                <DialogTrigger asChild>
                                    <Button disabled={!canManageUsers} className="flex items-center space-x-2">
                                        <UserPlus className="h-4 w-4" />
                                        <span>Invite User</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Invite Team Member</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="user@example.com"
                                                value={inviteForm.email}
                                                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="role">Role</Label>
                                            <Select
                                                value={inviteForm.role}
                                                onValueChange={(value: "admin" | "manager" | "worker") =>
                                                    setInviteForm({ ...inviteForm, role: value })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="worker">Worker</SelectItem>
                                                    <SelectItem value="manager">Manager</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="message">Personal Message (Optional)</Label>
                                            <Input
                                                id="message"
                                                placeholder="Welcome to our team!"
                                                value={inviteForm.message}
                                                onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                                            />
                                        </div>
                                        <Button onClick={handleInviteUser} disabled={loading} className="w-full">
                                            {loading ? "Sending Invitation..." : "Send Invitation"}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Users List */}
                        <div className="grid gap-4">
                            {users.map((user) => (
                                <Card key={user.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                                                    <AvatarFallback>
                                                        {user.name
                                                            .split(" ")
                                                            .map((n) => n[0])
                                                            .join("")}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="font-semibold">{user.name}</h3>
                                                        {getStatusIcon(user.status)}
                                                    </div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
                                                    <div className="flex items-center space-x-4 mt-1">
                                                        <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                                                        <span className="text-xs text-gray-500">Last active: {user.lastActive}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {canManageUsers && user.role !== "admin" && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleUpdateUserRole(user.id, "admin")}>
                                                            <Shield className="mr-2 h-4 w-4" />
                                                            Make Admin
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdateUserRole(user.id, "manager")}>
                                                            <Users className="mr-2 h-4 w-4" />
                                                            Make Manager
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdateUserRole(user.id, "worker")}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Make Worker
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="text-red-600 dark:text-red-400"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Remove User
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Roles & Permissions Tab */}
                    <TabsContent value="roles" className="space-y-6">
                        <div className="grid gap-6">
                            {/* Admin Role */}
                            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Shield className="h-5 w-5 text-red-500" />
                                        <span>Administrator</span>
                                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                                            Full Access
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                                        Full system access with all permissions. Can manage users, settings, and all farm operations.
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {[
                                            "Manage all pigs",
                                            "View all reports",
                                            "Manage users",
                                            "System settings",
                                            "Billing & plans",
                                            "Export data",
                                            "Delete records",
                                            "Breeding management",
                                            "Health tracking",
                                        ].map((permission) => (
                                            <div key={permission} className="flex items-center space-x-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                <span className="text-sm">{permission}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Manager Role */}
                            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Users className="h-5 w-5 text-blue-500" />
                                        <span>Manager</span>
                                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                                            Management Access
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                                        Can manage farm operations and view reports. Cannot manage users or system settings.
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {[
                                            "Manage all pigs",
                                            "View all reports",
                                            "Export data",
                                            "Breeding management",
                                            "Health tracking",
                                            "Feeding schedules",
                                        ].map((permission) => (
                                            <div key={permission} className="flex items-center space-x-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                <span className="text-sm">{permission}</span>
                                            </div>
                                        ))}
                                        {["Manage users", "System settings", "Billing & plans"].map((permission) => (
                                            <div key={permission} className="flex items-center space-x-2">
                                                <XCircle className="h-4 w-4 text-red-500" />
                                                <span className="text-sm text-gray-500">{permission}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Worker Role */}
                            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Edit className="h-5 w-5 text-green-500" />
                                        <span>Worker</span>
                                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                            Basic Access
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                                        Basic access to view and update pig information. Cannot access reports or management features.
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {["View pigs", "Update pig info", "Record feeding", "Basic health updates"].map(
                                            (permission) => (
                                                <div key={permission} className="flex items-center space-x-2">
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                    <span className="text-sm">{permission}</span>
                                                </div>
                                            ),
                                        )}
                                        {["View reports", "Export data", "Manage users", "System settings", "Delete records"].map(
                                            (permission) => (
                                                <div key={permission} className="flex items-center space-x-2">
                                                    <XCircle className="h-4 w-4 text-red-500" />
                                                    <span className="text-sm text-gray-500">{permission}</span>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

export default function UsersPage() {
    return (
        <ProtectedRoute>
            <UsersContent />
        </ProtectedRoute>
    )
}
