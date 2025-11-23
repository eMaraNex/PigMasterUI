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
import { User, Mail, Phone, Lock, Camera, Check, X, Loader2, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/auth/protected-route"
import { useRouter } from "next/navigation"
import { useSubscription } from "@/lib/subscription-context"

function ProfileContent() {
    const router = useRouter()
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
        await new Promise((resolve) => setTimeout(resolve, 1000))
        console.log("Changing password")
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
        setLoading(false)
    }

    const sendEmailVerification = async () => {
        setLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setEmailVerification({ ...emailVerification, showCodeInput: true })
        setLoading(false)
    }

    const verifyEmail = async () => {
        setLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setEmailVerification({ ...emailVerification, isVerified: true, showCodeInput: false })
        setLoading(false)
    }

    const sendPhoneVerification = async () => {
        setLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setPhoneVerification({ ...phoneVerification, showCodeInput: true })
        setLoading(false)
    }

    const verifyPhone = async () => {
        setLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setPhoneVerification({ ...phoneVerification, isVerified: true, showCodeInput: false })
        setLoading(false)
    }

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between mb-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="p-2 touch:p-3"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span className="ml-2 hidden sm:inline">Back</span>
                    </Button>
                    <div className="text-center">
                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            My Profile
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
                            Manage your personal info and settings
                        </p>
                    </div>
                    <div className="w-8 sm:w-10" /> {/* Spacer for alignment */}
                </div>

                {/* Profile Overview Card */}
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                            <div className="relative">
                                <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                                    <AvatarImage src={profileData.avatar || "/placeholder.svg"} />
                                    <AvatarFallback className="text-xl sm:text-2xl">
                                        {profileData.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                    </AvatarFallback>
                                </Avatar>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            size="sm"
                                            className="absolute -bottom-2 -right-2 rounded-full p-3 touch:p-4"
                                        >
                                            <Camera className="h-5 w-5" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="w-[90vw] max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Update Profile Picture</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <Input type="file" accept="image/*" className="text-sm" />
                                            <Button className="w-full text-base py-6 touch:py-8">Upload Photo</Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h2 className="text-xl sm:text-2xl font-bold">{profileData.name}</h2>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">{profileData.email}</p>
                                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                                    <Badge
                                        variant={tier === "free" ? "secondary" : tier === "standard" ? "default" : "destructive"}
                                        className="text-xs sm:text-sm px-3 py-1"
                                    >
                                        {tier.toUpperCase()} Plan
                                    </Badge>
                                    <div className="flex gap-2">
                                        {emailVerification.isVerified ? (
                                            <Badge variant="default" className="bg-green-500 text-xs sm:text-sm px-3 py-1">
                                                <Check className="h-3 w-3 mr-1" />
                                                Email Verified
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-xs sm:text-sm px-3 py-1">
                                                <X className="h-3 w-3 mr-1" />
                                                Email Unverified
                                            </Badge>
                                        )}
                                        {phoneVerification.isVerified ? (
                                            <Badge variant="default" className="bg-green-500 text-xs sm:text-sm px-3 py-1">
                                                <Check className="h-3 w-3 mr-1" />
                                                Phone Verified
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-xs sm:text-sm px-3 py-1">
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
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg overflow-x-auto">
                        <TabsTrigger
                            value="profile"
                            className="text-xs sm:text-sm py-3 touch:py-4"
                        >
                            Personal Info
                        </TabsTrigger>
                        <TabsTrigger
                            value="security"
                            className="text-xs sm:text-sm py-3 touch:py-4"
                        >
                            Security
                        </TabsTrigger>
                        <TabsTrigger
                            value="verification"
                            className="text-xs sm:text-sm py-3 touch:py-4"
                        >
                            Verification
                        </TabsTrigger>
                    </TabsList>

                    {/* Personal Info Tab */}
                    <TabsContent value="profile">
                        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                                    <User className="h-5 w-5" />
                                    <span>Personal Information</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-sm sm:text-base">Full Name</Label>
                                        <Input
                                            id="name"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                            className="text-sm sm:text-base h-12 touch:h-14"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm sm:text-base">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                            className="text-sm sm:text-base h-12 touch:h-14"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-sm sm:text-base">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                            className="text-sm sm:text-base h-12 touch:h-14"
                                        />
                                    </div>
                                </div>
                                <Button
                                    onClick={handleProfileUpdate}
                                    disabled={loading}
                                    className="w-full text-base h-12 touch:h-14"
                                >
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
                                <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                                    <Lock className="h-5 w-5" />
                                    <span>Change Password</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="current-password" className="text-sm sm:text-base">Current Password</Label>
                                        <Input
                                            id="current-password"
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="text-sm sm:text-base h-12 touch:h-14"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password" className="text-sm sm:text-base">New Password</Label>
                                        <Input
                                            id="new-password"
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="text-sm sm:text-base h-12 touch:h-14"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password" className="text-sm sm:text-base">Confirm New Password</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="text-sm sm:text-base h-12 touch:h-14"
                                        />
                                    </div>
                                </div>
                                <Button
                                    onClick={handlePasswordChange}
                                    disabled={loading}
                                    className="w-full text-base h-12 touch:h-14"
                                >
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
                        <div className="space-y-4">
                            {/* Email Verification */}
                            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                                        <Mail className="h-5 w-5" />
                                        <span>Email Verification</span>
                                        {emailVerification.isVerified && <Check className="h-5 w-5 text-green-500" />}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                        {emailVerification.isVerified
                                            ? "Your email address has been verified."
                                            : "Verify your email address to receive notifications and secure your account."}
                                    </p>
                                    {!emailVerification.isVerified && (
                                        <>
                                            {!emailVerification.showCodeInput ? (
                                                <Button
                                                    onClick={sendEmailVerification}
                                                    disabled={loading}
                                                    className="w-full text-base h-12 touch:h-14"
                                                >
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
                                                        <Label htmlFor="email-code" className="text-sm sm:text-base">Verification Code</Label>
                                                        <Input
                                                            id="email-code"
                                                            placeholder="Enter 6-digit code"
                                                            value={emailVerification.code}
                                                            onChange={(e) => setEmailVerification({ ...emailVerification, code: e.target.value })}
                                                            className="text-sm sm:text-base h-12 touch:h-14"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                                        <Button
                                                            onClick={verifyEmail}
                                                            disabled={loading}
                                                            className="text-base h-12 touch:h-14"
                                                        >
                                                            {loading ? (
                                                                <>
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    Verifying...
                                                                </>
                                                            ) : (
                                                                "Verify Email"
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={sendEmailVerification}
                                                            disabled={loading}
                                                            className="text-base h-12 touch:h-14"
                                                        >
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
                                    <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                                        <Phone className="h-5 w-5" />
                                        <span>Phone Verification</span>
                                        {phoneVerification.isVerified && <Check className="h-5 w-5 text-green-500" />}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                        {phoneVerification.isVerified
                                            ? "Your phone number has been verified."
                                            : "Verify your phone number to receive SMS notifications and alerts."}
                                    </p>
                                    {!phoneVerification.isVerified && (
                                        <>
                                            {!phoneVerification.showCodeInput ? (
                                                <Button
                                                    onClick={sendPhoneVerification}
                                                    disabled={loading}
                                                    className="w-full text-base h-12 touch:h-14"
                                                >
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
                                                        <Label htmlFor="phone-code" className="text-sm sm:text-base">SMS Verification Code</Label>
                                                        <Input
                                                            id="phone-code"
                                                            placeholder="Enter 6-digit code"
                                                            value={phoneVerification.code}
                                                            onChange={(e) => setPhoneVerification({ ...phoneVerification, code: e.target.value })}
                                                            className="text-sm sm:text-base h-12 touch:h-14"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                                        <Button
                                                            onClick={verifyPhone}
                                                            disabled={loading}
                                                            className="text-base h-12 touch:h-14"
                                                        >
                                                            {loading ? (
                                                                <>
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    Verifying...
                                                                </>
                                                            ) : (
                                                                "Verify Phone"
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={sendPhoneVerification}
                                                            disabled={loading}
                                                            className="text-base h-12 touch:h-14"
                                                        >
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

export default function ProfilePage() {
    return (
        <ProtectedRoute>
            <ProfileContent />
        </ProtectedRoute>
    )
}