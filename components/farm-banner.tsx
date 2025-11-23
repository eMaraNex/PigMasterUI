"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import FarmCreationModal from "@/components/farm-creation-modal";
import { FarmBannerProps } from "@/types/farms";


const FarmBanner: React.FC<FarmBannerProps> = ({ onFarmCreated }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    if (isDismissed) return null;

    return (
        <>
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl shadow-md mb-6 flex items-center justify-between animate-fade-in">
                <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            No farm set up yet
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                            Create a farm to start managing your pigs.
                        </p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsDismissed(true)}
                        className="border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                    >
                        Dismiss
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setIsOpen(true)}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    >
                        Create Farm
                    </Button>
                </div>
            </div>
            <FarmCreationModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onFarmCreated={onFarmCreated}
            />
        </>
    );
};

export default FarmBanner;