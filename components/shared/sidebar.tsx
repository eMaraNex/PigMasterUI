"use client"

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User, Settings, Users, CreditCard, LogOut, X, Plus, Building } from "lucide-react";
import CurrencySelector from "@/components/currency-selector";
import { SidebarProps } from "@/types";

const Sidebar: React.FC<SidebarProps & { handleAddRow: () => void; addRowOpen: boolean }> = ({
    isOpen,
    onClose,
    user,
    rows,
    logout,
    handleRowAdded,
    hasFarm,
    handleAddRow,
    addRowOpen,
}) => {
    const router = useRouter()

    const handleMenuClick = (action: string) => {
        switch (action) {
            case "profile":
                router.push("/profile")
                break
            case "settings":
                router.push("/settings")
                break
            case "users":
                router.push("/users")
                break
            case "pricing":
                router.push("/pricing")
                break
            case "add-row":
                handleAddRow()
                break
            case "logout":
                logout()
                break
            default:
                break
        }
        onClose() // Close sidebar after navigation
    }

    return (
        <div
            className={`fixed inset-y-0 right-0 z-50 w-72 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-l border-white/20 dark:border-gray-700/20 transform ${isOpen ? "translate-x-0" : "translate-x-full"
                } transition-transform duration-300 ease-in-out shadow-lg md:hidden overflow-y-auto`}
            aria-hidden={!isOpen}
        >
            <div className="flex justify-between items-center px-4 py-3 border-b border-white/20 dark:border-gray-700/20">
                <h2 className="text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    Menu
                </h2>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="rounded-full h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Close sidebar"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex flex-col px-4 py-4 space-y-3">
                {/* User Info */}
                <div className="bg-white/60 dark:bg-gray-700/60 rounded-lg px-4 py-3 shadow-sm">
                    <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || "No email"}</p>
                        </div>
                    </div>
                </div>

                {/* Rows Count */}
                {hasFarm && (
                    <div className="bg-white/60 dark:bg-gray-700/60 rounded-lg px-4 py-3 shadow-sm">
                        <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                            <span className="text-sm font-medium">{rows.length} Active Rows</span>
                        </div>
                    </div>
                )}

                {/* Navigation Items */}
                <Button
                    variant="ghost"
                    className="w-full justify-start text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleMenuClick("profile")}
                >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                </Button>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleMenuClick("settings")}
                >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                </Button>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleMenuClick("users")}
                >
                    <Users className="h-4 w-4 mr-2" />
                    Team
                </Button>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleMenuClick("pricing")}
                >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Billing & Plans
                </Button>
                {hasFarm && (
                    <Button
                        onClick={() => handleMenuClick("add-row")}
                        className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-500 text-white text-sm py-2"
                        disabled={addRowOpen}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Row
                    </Button>
                )}
                <div className="w-full space-y-2">
                    <CurrencySelector />
                    {/* <ThemeToggle /> */}
                </div>
                <Button
                    onClick={() => handleMenuClick("logout")}
                    variant="outline"
                    className="w-full text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                </Button>
            </div>
        </div>
    );
};

export default Sidebar;