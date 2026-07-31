import React from "react";
import { useAppStore } from "@/stores/app-store";
import { PersonalDashboard } from "@/components/screens/dashboard/PersonalDashboard";
import { BusinessDashboard } from "@/components/screens/dashboard/BusinessDashboard";
import { FamilyDashboard } from "@/components/screens/dashboard/FamilyDashboard";

export default function DashboardScreen() {
  const { currentAccount } = useAppStore();

  if (currentAccount?.type === "business") {
    return <BusinessDashboard />;
  }

  if (currentAccount?.type === "family") {
    return <FamilyDashboard />;
  }

  // Fallback to personal for 'personal' type or any undefined state
  return <PersonalDashboard />;
}
