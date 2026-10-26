"use client";

import PigList from "@/components/pig-list";
import PageShell from "@/components/shared/page-shell";
import ProtectedRoute from "@/components/auth/protected-route";
import { useAuth } from "@/lib/auth-context";

export default function PigsPage() {
    const { user } = useAuth();
    return (
        <ProtectedRoute>
            <PageShell title="All pigs" description="Search, filter and manage every pig on the farm." width="xl">
                {user?.farm_id && <PigList farmId={user.farm_id} />}
            </PageShell>
        </ProtectedRoute>
    );
}
