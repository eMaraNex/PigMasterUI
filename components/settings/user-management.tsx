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
import { Plus, Edit, Trash2, Mail, Phone, Shield, Crown, UserCheck } from "lucide-react"
import { useSubscription } from "@/lib/subscription-context"

interface User {
    id: string
    name: string
    email: string
    phone?: string
    role: "admin" | "manager" | "worker"
    status: "active" | "pending" | "inactive"
    avatar?: string
    lastLogin?: string
    createdAt: string
}

const rolePermissions = {
    admin: {
        name: "Administrator",
        description: "Full access to all features and settings",
        color: "bg-red-500",
        permissions: ["all"],
    },
    manager: {
        name: "Farm Manager",
        description: "Manage pigs, reports, and basic settings",
        color: "bg-blue-500",
        permissions: ["manage_pigs", "view_reports", "export_reports", "manage_health", "manage_breeding"],
    },
    worker: {
        name: "Farm Worker",
        description: "Basic access to view and update pig records",
        color: "bg-green-500",
        permissions: ["view_pigs", "update_feeding", "view_basic_reports"],
    },
}

export default function UserManagement() {
    const { tier, limits, canAddMore, isFeatureAvailable } = useSubscription()
    const [users, setUsers] = useState<User[]>([
        {
            id: "1",
            name: "John Doe",
            email: "john@example.com",
            phone: "+1234567890",
            role: "admin",
            status: "active",
            avatar: "",
            lastLogin: "2024-01-15T10:30:00Z",
            createdAt: "2024-01-01T00:00:00Z",
        },
        {
            id: "2",
            name: "Jane Smith",
            email: "jane@example.com",
            phone: "+1234567891",
            role: "manager",
            status: "active",
            avatar: "",
            lastLogin: "2024-01-14T15:45:00Z",
            createdAt: "2024-01-05T00:00:00Z",
        },
    ])

    const [showAddUser, setShowAddUser] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        phone: "",
        role: "worker" as const,
    })

    const canAddUsers = isFeatureAvailable("user_management") && canAddMore("users", users.length)

    const handleAddUser = () => {
        const user: User = {
            id: Date.now().toString(),
            ...newUser,
            status: "pending",
            createdAt: new Date().toISOString(),
        }
        setUsers([...users, user])
        setNewUser({ name: "", email: "", phone: "", role: "worker" })
        setShowAddUser(false)
    }

    const handleEditUser = (user: User) => {
        setEditingUser(user)
    }

    const handleUpdateUser = () => {
        if (!editingUser) return
        setUsers(users.map((u) => (u.id === editingUser.id ? editingUser : u)))
        setEditingUser(null)
    }

    const handleDeleteUser = (userId: string) => {
        setUsers(users.filter((u) => u.id !== userId))
    }

    const getRoleBadge = (role: string) => {
        const roleInfo = rolePermissions[role as keyof typeof rolePermissions]
        return <Badge className={`${roleInfo.color} text-white`}>{roleInfo.name}</Badge>
    }

    const getStatusBadge = (status: string) => {
        const statusColors = {
            active: "bg-green-500",
            pending: "bg-yellow-500",
            inactive: "bg-gray-500",
        }
        return (
            <Badge className={`${statusColors[status as keyof typeof statusColors]} text-white`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        )
    }

    if (!isFeatureAvailable("user_management")) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 p-6">
                <div className="max-w-4xl mx-auto">
                    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                        <CardContent className="p-12 text-center">
                            <Crown className="h-16 w-16 mx-auto text-purple-500 mb-4" />
                            <h2 className="text-2xl font-bold mb-4">User Management</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                User management is available in Standard and Advanced plans. Upgrade to add team members and manage
                                roles.
                            </p>
                            <Button className="bg-purple-600 hover:bg-purple-700">Upgrade to Standard Plan</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            User Management
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 text-lg mt-2">
                            Manage team members and their access permissions
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Badge variant="outline" className="px-3 py-1">
                            {users.length} / {limits.maxUsers === -1 ? "∞" : limits.maxUsers} Users
                        </Badge>
                        <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                            <DialogTrigger asChild>
                                <Button disabled={!canAddUsers} className="flex items-center space-x-2">
                                    <Plus className="h-4 w-4" />
                                    <span>Add User</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New User</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            value={newUser.name}
                                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={newUser.phone}
                                            onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select
                                            value={newUser.role}
                                            onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="worker">Farm Worker</SelectItem>
                                                <SelectItem value="manager">Farm Manager</SelectItem>
                                                <SelectItem value="admin">Administrator</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={handleAddUser} className="w-full">
                                        Send Invitation
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Users Grid */}
                <div className="grid gap-6">
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
                                            <h3 className="font-semibold text-lg">{user.name}</h3>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                                                <Mail className="h-4 w-4" />
                                                <span>{user.email}</span>
                                                {user.phone && (
                                                    <>
                                                        <span>•</span>
                                                        <Phone className="h-4 w-4" />
                                                        <span>{user.phone}</span>
                                                    </>
                                                )}
                                            </div>
                                            {user.lastLogin && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Last login: {new Date(user.lastLogin).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="text-right space-y-2">
                                            {getRoleBadge(user.role)}
                                            {getStatusBadge(user.status)}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Role Permissions */}
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Shield className="h-5 w-5" />
                            <span>Role Permissions</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {Object.entries(rolePermissions).map(([role, info]) => (
                                <div key={role} className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-3 h-3 rounded-full ${info.color}`} />
                                        <h4 className="font-semibold">{info.name}</h4>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{info.description}</p>
                                    <div className="space-y-1">
                                        {info.permissions.map((permission) => (
                                            <div key={permission} className="flex items-center space-x-2 text-sm">
                                                <UserCheck className="h-3 w-3 text-green-500" />
                                                <span className="capitalize">{permission.replace("_", " ")}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Edit User Dialog */}
                {editingUser && (
                    <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit User</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">Full Name</Label>
                                    <Input
                                        id="edit-name"
                                        value={editingUser.name}
                                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-email">Email Address</Label>
                                    <Input
                                        id="edit-email"
                                        type="email"
                                        value={editingUser.email}
                                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-phone">Phone Number</Label>
                                    <Input
                                        id="edit-phone"
                                        type="tel"
                                        value={editingUser.phone || ""}
                                        onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-role">Role</Label>
                                    <Select
                                        value={editingUser.role}
                                        onValueChange={(value: any) => setEditingUser({ ...editingUser, role: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="worker">Farm Worker</SelectItem>
                                            <SelectItem value="manager">Farm Manager</SelectItem>
                                            <SelectItem value="admin">Administrator</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-status">Status</Label>
                                    <Select
                                        value={editingUser.status}
                                        onValueChange={(value: any) => setEditingUser({ ...editingUser, status: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleUpdateUser} className="w-full">
                                    Update User
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    )
}
