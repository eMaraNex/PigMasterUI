"use client";

import { use } from "react";
import ProtectedRoute from "@/components/auth/protected-route";
import PigProfileView from "@/components/pig-profile/pig-profile-view";

export default function PigProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedRoute>
      <PigProfileView id={id} />
    </ProtectedRoute>
  );
}
