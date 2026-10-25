"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Check, ChevronDown, CreditCard, Crown, Loader2, LogOut, PiggyBank, PlayCircle, Plus, Settings, Sparkles, User, Users,
} from "lucide-react";
import CurrencySelector from "@/components/currency-selector";
import ThemeToggle from "@/components/theme-toggle";
import { useSubscription } from "@/lib/subscription-context";
import { useAuth } from "@/lib/auth-context";
import { usePermissions } from "@/lib/permissions";
import { apiRequest } from "@/lib/api/client";
import { api } from "@/lib/redux/api";
import { useAppDispatch } from "@/lib/redux/hooks";
import { useToast } from "@/lib/toast-provider";
import type { HeaderProps } from "@/types/shared";

const initials = (name?: string) =>
    (name ?? "U").split(" ").filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "U";

/** Plan / trial chip. Owners can click through to billing. */
function PlanChip() {
    const router = useRouter();
    const { ready, tier, isTrialActive, trialDaysLeft, isFarmOwner } = useSubscription();
    if (!ready) return <span className="hidden h-8 w-24 animate-pulse rounded-full bg-gray-100 dark:bg-gray-700 sm:inline-block" />;

    const label = isTrialActive ? `Trial · ${trialDaysLeft}d left` : `${tier.charAt(0).toUpperCase()}${tier.slice(1)}`;
    const tone = isTrialActive
        ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
        : tier === "free"
            ? "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            : "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-200";
    const Icon = isTrialActive ? Sparkles : Crown;

    return (
        <button
            type="button"
            disabled={!isFarmOwner}
            onClick={() => router.push("/settings?tab=billing")}
            className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition enabled:hover:shadow-sm sm:inline-flex ${tone}`}
            title={isFarmOwner ? "Manage plan" : "Plan of this farm"}
        >
            <Icon className="h-3.5 w-3.5" />
            {label}
        </button>
    );
}

/** Farm name with a switcher for people who can open more than one farm. */
function FarmSwitcher({ farmName, rowsCount }: { farmName: string; rowsCount: number }) {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { showError } = useToast();
    const { farms, role } = usePermissions();
    const { user } = useAuth();
    const [switching, setSwitching] = useState<string | null>(null);
    const current = farms.find(farm => farm.id === user?.farm_id);

    const switchTo = async (farmId: string) => {
        setSwitching(farmId);
        try {
            await apiRequest.post(`/farms/switch/${farmId}`);
            // Everything cached belongs to the previous farm.
            dispatch(api.util.resetApiState());
            window.location.assign("/");
        } catch (error: any) {
            showError("Could not switch farm", error?.response?.data?.message);
            setSwitching(null);
        }
    };

    const title = (
        <div className="min-w-0 text-left">
            <p className="flex items-center gap-1 truncate text-sm font-bold text-gray-900 dark:text-white sm:text-base">
                <span className="truncate">{farmName || "My farm"}</span>
                {farms.length > 1 && <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />}
            </p>
            <p className="hidden truncate text-xs text-gray-500 dark:text-gray-400 sm:block">
                {[role?.name, `${rowsCount} row${rowsCount === 1 ? "" : "s"}`, current?.location].filter(Boolean).join(" · ")}
            </p>
        </div>
    );

    if (farms.length <= 1) {
        return (
            <button type="button" onClick={() => router.push("/")} className="min-w-0">
                {title}
            </button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button type="button" className="min-w-0 rounded-lg px-1 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-800">{title}</button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuLabel className="text-xs font-medium text-gray-500">Switch farm</DropdownMenuLabel>
                {farms.map(farm => (
                    <DropdownMenuItem key={farm.id} onClick={() => farm.id !== current?.id && switchTo(farm.id)} className="cursor-pointer gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-blue-500 text-[11px] font-bold text-white">
                            {initials(farm.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{farm.name}</span>
                            <span className="block truncate text-xs text-gray-500">{farm.role_name}{farm.location ? ` · ${farm.location}` : ""}</span>
                        </span>
                        {switching === farm.id ? <Loader2 className="h-4 w-4 animate-spin" /> : farm.id === current?.id && <Check className="h-4 w-4 text-green-600" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

const Header: React.FC<HeaderProps> = ({
    user,
    rows,
    logout,
    CurrencySelector: CurrencySelectorComponent = CurrencySelector,
    ThemeToggle: ThemeToggleComponent = ThemeToggle,
    handleAddRow,
    farmName,
}) => {
    const router = useRouter();
    const { can, isOwner } = usePermissions();
    const canAddRow = can("rows", "create");

    return (
        <TooltipProvider delayDuration={200}>
            <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/85 backdrop-blur-md dark:border-gray-700/60 dark:bg-gray-900/85">
                <div className="flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.push("/")}
                            className="shrink-0 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 p-2 shadow-sm"
                            aria-label="PigMaster home"
                        >
                            <PiggyBank className="h-5 w-5 text-white" />
                        </button>
                        <FarmSwitcher farmName={String(farmName ?? "")} rowsCount={rows?.length ?? 0} />
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                        <PlanChip />
                        {canAddRow && (
                            <Button onClick={handleAddRow} size="sm" className="hidden h-9 bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 md:inline-flex">
                                <Plus className="mr-1 h-4 w-4" />
                                Add row
                            </Button>
                        )}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => router.push("/youtube-tutorials")} aria-label="Video tutorials">
                                    <PlayCircle className="h-5 w-5 text-red-500" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Video tutorials</TooltipContent>
                        </Tooltip>
                        <ThemeToggleComponent />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-10 gap-2 rounded-xl px-1.5 sm:px-2">
                                    {user?.avatar_url ? (
                                        <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-gradient-to-br from-green-100 to-blue-100 text-xs font-semibold text-blue-800 dark:from-green-900 dark:to-blue-900 dark:text-blue-100">
                                                {initials(user?.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                    <ChevronDown className="hidden h-4 w-4 text-gray-500 sm:block" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-72 p-1.5">
                                <DropdownMenuLabel className="px-2 py-2">
                                    <p className="truncate text-sm font-semibold">{user?.name || "User"}</p>
                                    <p className="truncate text-xs font-normal text-gray-500">{user?.email}</p>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push("/settings?tab=profile")} className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />Profile & security
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />Farm settings
                                </DropdownMenuItem>
                                {can("team", "read") && (
                                    <DropdownMenuItem onClick={() => router.push("/settings?tab=team")} className="cursor-pointer">
                                        <Users className="mr-2 h-4 w-4" />Team & access
                                    </DropdownMenuItem>
                                )}
                                {isOwner && (
                                    <DropdownMenuItem onClick={() => router.push("/settings?tab=billing")} className="cursor-pointer">
                                        <CreditCard className="mr-2 h-4 w-4" />Billing & plan
                                    </DropdownMenuItem>
                                )}
                                {canAddRow && (
                                    <DropdownMenuItem onClick={handleAddRow} className="cursor-pointer md:hidden">
                                        <Plus className="mr-2 h-4 w-4" />Add row
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <div className="px-2 py-1.5">
                                    <p className="mb-1 text-xs font-medium text-gray-500">Display currency</p>
                                    <CurrencySelectorComponent />
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400">
                                    <LogOut className="mr-2 h-4 w-4" />Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>
        </TooltipProvider>
    );
};

export default Header;
