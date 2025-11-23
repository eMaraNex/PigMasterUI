"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/lib/subscription-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const UpgradePrompt: React.FC<{ feature: string }> = ({ feature }) => {
  const router = useRouter();
  const { getNextTier } = useSubscription();
  const nextTier = getNextTier();

  if (!nextTier) return null; 

  return (
    <Card className="max-w-md mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-xl">
      <CardHeader>
        <CardTitle className="text-center text-xl font-bold text-gray-900 dark:text-white">
          Upgrade Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-gray-600 dark:text-gray-300">
          Access to "{feature}" is available on the {nextTier.toUpperCase()} tier.
        </p>
        <Button
          onClick={() => router.push("/pricing")}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
        >
          Upgrade to {nextTier.toUpperCase()}
        </Button>
      </CardContent>
    </Card>
  );
};

export default UpgradePrompt;