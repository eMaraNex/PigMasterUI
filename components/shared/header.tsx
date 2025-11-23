"use client";

import type React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Circle, Building, Menu, Plus, User, Settings, CreditCard, LogOut, ChevronDown, Users, Youtube } from "lucide-react";
import CurrencySelector from "@/components/currency-selector";
import ThemeToggle from "@/components/theme-toggle";
import { useSubscription } from "@/lib/subscription-context";
import type { HeaderProps } from "@/types/shared";

const Header: React.FC<HeaderProps> = ({
    user,
    rows,
    logout,
    toggleSidebar,
    CurrencySelector: CurrencySelectorComponent = CurrencySelector,
    ThemeToggle: ThemeToggleComponent = ThemeToggle,
    handleAddRow,
    farmName,
}) => {
    const router = useRouter();
    const { tier } = useSubscription();

    const handleMenuClick = (action: string) => {
        switch (action) {
            case "profile":
                router.push("/profile");
                break;
            case "settings":
                router.push("/settings");
                break;
            case "users":
                router.push("/users");
                break;
            case "pricing":
                router.push("/pricing");
                break;
            case "add-row":
                handleAddRow();
                break;
            case "logout":
                logout();
                break;
            default:
                break;
        }
    };

    const handleClick = () => {
        router.push('/');
    };

    return (
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm border-b border-white/20 dark:border-gray-700/20 sticky top-0 z-40">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-3 sm:py-4">
                    {/* Left Section: Farm Logo and Name */}
                    <div
                        className="flex items-center space-x-3 cursor-pointer"
                        onClick={handleClick}
                    >
                        <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl">
                            <Circle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent truncate">
                                {farmName || "Pig Farm"}
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block truncate">
                                Professional Pig Management System
                            </p>
                        </div>
                    </div>

                    {/* Right Section: Actions */}
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center space-x-2 sm:space-x-3">
                       <Badge
                            variant={tier === "free" ? "secondary" : tier === "standard" ? "default" : "destructive"}
                            className="shadow-sm px-3 py-2 min-w-[120px] justify-center rounded-lg text-xs sm:text-sm"
                            >
                            {tier.toUpperCase()} Plan
                            </Badge>
                            <Button
                                onClick={() => router.push("/youtube-tutorials")}
                                className={`
                                    h-10 w-100 rectangular-full 
                                    bg-red-500 hover:bg-red-600 
                                    text-white shadow-lg hover:shadow-xl 
                                    px-1
                                `}
                                size="icon"
                                aria-label="Youtube"
                            >
                                
                                <Youtube className="h-4 w-4 mr-1" />
                                Tutorials
                            </Button>
                            <Badge
                                variant="outline"
                                className="bg-white/60 dark:bg-gray-700/60 shadow-sm px-3 py-2 min-w-[120px] justify-center rounded-lg text-xs sm:text-sm"
                            >
                                <Building className="h-3.5 w-3.5 mr-1.5" />
                                {rows?.length || 0} Rows
                            </Badge>
                            <Button
                                onClick={handleAddRow}
                                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-500 text-white text-xs sm:text-sm px-3 py-2"
                            >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add Row
                            </Button>
                        </div>
                        {/* User Dropdown */}
                        <ThemeToggleComponent />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="flex items-center space-x-2 px-2 py-1.5 h-10 sm:h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                                >
                                    {user?.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt="User avatar"
                                        className="h-8 w-8 rounded-full object-cover"
                                        referrerPolicy="no-referrer"
                                    />
                                    ) : (
                                        <Avatar>
                                            <AvatarFallback className="text-xs sm:text-sm">
                                                {user?.name?.split(" ").map((n: any) => n[0]).join("") || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}

                                    <div className="hidden sm:flex flex-col text-left">
                                        <p className="text-xs sm:text-sm font-medium truncate max-w-[120px]">
                                            {user?.name || "User"}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                                            {user?.email}
                                        </p>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-0 shadow-xl p-2"
                            >
                                <DropdownMenuSeparator />
                                <div className="px-2 py-1 space-y-2">
                                    <CurrencySelectorComponent />
                                </div>
                                <DropdownMenuItem onClick={() => handleMenuClick("profile")} className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    <div>
                                        <p className="text-sm font-medium">Profile</p>
                                        <p className="text-xs text-gray-500">Manage your account</p>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMenuClick("settings")} className="cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <div>
                                        <p className="text-sm font-medium">Settings</p>
                                        <p className="text-xs text-gray-500">Notifications & preferences</p>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMenuClick("users")} className="cursor-pointer">
                                    <Users className="mr-2 h-4 w-4" />
                                    <div>
                                        <p className="text-sm font-medium">Team</p>
                                        <p className="text-xs text-gray-500">Manage team members</p>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMenuClick("add-row")} className="cursor-pointer md:hidden">
                                    <Plus className="mr-2 h-4 w-4" />
                                    <div>
                                        <p className="text-sm font-medium">Add Row</p>
                                        <p className="text-xs text-gray-500">Add a new row to your farm</p>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMenuClick("pricing")} className="cursor-pointer">
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    <div>
                                        <p className="text-sm font-medium">Billing & Plans</p>
                                        <p className="text-xs text-gray-500">Manage subscription</p>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => handleMenuClick("logout")}
                                    className="cursor-pointer text-red-600 dark:text-red-400"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <div>
                                        <p className="text-sm font-medium">Sign out</p>
                                        <p className="text-xs text-gray-500">Sign out of your account</p>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;