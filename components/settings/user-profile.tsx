"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { User, Mail, Phone, Lock, Camera, Check, X, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useSubscription } from "@/lib/subscription-context"

export default function UserProfile() {
    const { user } = useAuth()
    const { tier } = useSubscription()
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState("profile")

    // Profile form state
    const [profileData, setProfileData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        avatar: user?.avatar || "",
    })

    // Password form state
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })

    // Verification states
    const [emailVerification, setEmailVerification] = useState({
        isVerified: user?.email_verified || false,
        code: "",
        showCodeInput: false,
    })

    const [phoneVerification, setPhoneVerification] = useState({
        isVerified: user?.phone_verified || false,
        code: "",
        showCodeInput: false,
    })

    const handleProfileUpdate = async () => {
        setLoading(true)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))
        console.log("Updating profile:", profileData)
        setLoading(false)
    }

    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert("Passwords don't match!")
            return
        }
        setLoading(true)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))
        console.log("Changing password")
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
        setLoading(false)
    }

    const sendEmailVerification = async () => {
        setLoading(true)
        // Simulate sending verification email
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setEmailVerification({ ...emailVerification, showCodeInput: true })
        setLoading(false)
    }

    const verifyEmail = async () => {
        setLoading(true)
        // Simulate email verification
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setEmailVerification({ ...emailVerification, isVerified: true, showCodeInput: false })
        setLoading(false)
    }

    const sendPhoneVerification = async () => {
        setLoading(true)
        // Simulate sending SMS verification
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setPhoneVerification({ ...phoneVerification, showCodeInput: true })
        setLoading(false)
    }

    const verifyPhone = async () => {
        setLoading(true)
        // Simulate phone verification
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setPhoneVerification({ ...phoneVerification, isVerified: true, showCodeInput: false })
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 p-6">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        My Profile
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                        Manage your personal information and security settings
                    </p>
                </div>

                {/* Profile Overview Card */}
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                    <CardContent className="p-8">
                        <div className="flex items-center space-x-6">
                            <div className="relative">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={profileData.avatar || "/placeholder.svg"} />
                                    <AvatarFallback className="text-2xl">
                                        {profileData.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                    </AvatarFallback>
                                </Avatar>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button size="sm" className="absolute -bottom-2 -right-2 rounded-full p-2">
                                            <Camera className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Update Profile Picture</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <Input type="file" accept="image/*" />
                                            <Button className="w-full">Upload Photo</Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold">{profileData.name}</h2>
                                <p className="text-gray-600 dark:text-gray-300">{profileData.email}</p>
                                <div className="flex items-center space-x-4 mt-4">
                                    <Badge variant={tier === "free" ? "secondary" : tier === "standard" ? "default" : "destructive"}>
                                        {tier.toUpperCase()} Plan
                                    </Badge>
                                    <div className="flex items-center space-x-2">
                                        {emailVerification.isVerified ? (
                                            <Badge variant="default" className="bg-green-500">
                                                <Check className="h-3 w-3 mr-1" />
                                                Email Verified
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                <X className="h-3 w-3 mr-1" />
                                                Email Unverified
                                            </Badge>
                                        )}
                                        {phoneVerification.isVerified ? (
                                            <Badge variant="default" className="bg-green-500">
                                                <Check className="h-3 w-3 mr-1" />
                                                Phone Verified
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                <X className="h-3 w-3 mr-1" />
                                                Phone Unverified
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Profile Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg">
                        <TabsTrigger value="profile">Personal Info</TabsTrigger>
                        <TabsTrigger value="security">Security</TabsTrigger>
                        <TabsTrigger value="verification">Verification</TabsTrigger>
                    </TabsList>

                    {/* Personal Info Tab */}
                    <TabsContent value="profile">
                        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <User className="h-5 w-5" />
                                    <span>Personal Information</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleProfileUpdate} disabled={loading} className="w-full md:w-auto">
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        "Update Profile"
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security">
                        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Lock className="h-5 w-5" />
                                    <span>Change Password</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="current-password">Current Password</Label>
                                        <Input
                                            id="current-password"
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password">New Password</Label>
                                        <Input
                                            id="new-password"
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <Button onClick={handlePasswordChange} disabled={loading} className="w-full md:w-auto">
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Changing...
                                        </>
                                    ) : (
                                        "Change Password"
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Verification Tab */}
                    <TabsContent value="verification">
                        <div className="space-y-6">
                            {/* Email Verification */}
                            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Mail className="h-5 w-5" />
                                        <span>Email Verification</span>
                                        {emailVerification.isVerified && <Check className="h-5 w-5 text-green-500" />}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {emailVerification.isVerified
                                            ? "Your email address has been verified."
                                            : "Verify your email address to receive notifications and secure your account."}
                                    </p>
                                    {!emailVerification.isVerified && (
                                        <>
                                            {!emailVerification.showCodeInput ? (
                                                <Button onClick={sendEmailVerification} disabled={loading}>
                                                    {loading ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Sending...
                                                        </>
                                                    ) : (
                                                        "Send Verification Email"
                                                    )}
                                                </Button>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="email-code">Verification Code</Label>
                                                        <Input
                                                            id="email-code"
                                                            placeholder="Enter 6-digit code"
                                                            value={emailVerification.code}
                                                            onChange={(e) => setEmailVerification({ ...emailVerification, code: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <Button onClick={verifyEmail} disabled={loading}>
                                                            {loading ? (
                                                                <>
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    Verifying...
                                                                </>
                                                            ) : (
                                                                "Verify Email"
                                                            )}
                                                        </Button>
                                                        <Button variant="outline" onClick={sendEmailVerification} disabled={loading}>
                                                            Resend Code
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Phone Verification */}
                            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Phone className="h-5 w-5" />
                                        <span>Phone Verification</span>
                                        {phoneVerification.isVerified && <Check className="h-5 w-5 text-green-500" />}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {phoneVerification.isVerified
                                            ? "Your phone number has been verified."
                                            : "Verify your phone number to receive SMS notifications and alerts."}
                                    </p>
                                    {!phoneVerification.isVerified && (
                                        <>
                                            {!phoneVerification.showCodeInput ? (
                                                <Button onClick={sendPhoneVerification} disabled={loading}>
                                                    {loading ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Sending...
                                                        </>
                                                    ) : (
                                                        "Send SMS Code"
                                                    )}
                                                </Button>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="phone-code">SMS Verification Code</Label>
                                                        <Input
                                                            id="phone-code"
                                                            placeholder="Enter 6-digit code"
                                                            value={phoneVerification.code}
                                                            onChange={(e) => setPhoneVerification({ ...phoneVerification, code: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <Button onClick={verifyPhone} disabled={loading}>
                                                            {loading ? (
                                                                <>
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    Verifying...
                                                                </>
                                                            ) : (
                                                                "Verify Phone"
                                                            )}
                                                        </Button>
                                                        <Button variant="outline" onClick={sendPhoneVerification} disabled={loading}>
                                                            Resend Code
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
