// components/ClientHeaderWrapper.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useSubscription } from "@/lib/subscription-context";
import Header from "@/components/shared/header";
import CurrencySelector from "@/components/currency-selector";
import ThemeToggle from "@/components/theme-toggle";
import axios from "axios";
import * as utils from "@/lib/utils";
import AddRowDialog from "./add-row-dialog";

const ClientHeaderWrapper: React.FC = () => {
    const { user, logout } = useAuth();
    const { tier } = useSubscription();
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const [addRowOpen, setAddRowOpen] = useState<boolean>(false);
    const [rows, setRows] = useState<any[]>([]);
    const [farmName, setFarmName] = useState<string>("");

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleAddRow = useCallback(() => {
        setAddRowOpen(true);
    }, []);


    const loadData = useCallback(async () => {
        if (!user?.farm_id) {
            setFarmName("Pig Farm");
            setRows([]);
            return;
        }
        try {
            const token = localStorage.getItem("pig_farm_token");
            if (!token) throw new Error("No authentication token found");

            const [rowsResponse, farmResponse] = await Promise.all([
                axios.get(`${utils.apiUrl}/rows/list/${user.farm_id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${utils.apiUrl}/farms/${user.farm_id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            setRows(rowsResponse.data.data || []);
            setFarmName(farmResponse.data.data?.name || "Pig Farm");
        } catch (error) {
            console.error("Error fetching header data:", error);
            const cachedFarmDetails = localStorage.getItem(`pig_farm_data`);
            const cachedRows = localStorage.getItem(`pig_farm_rows_${user.farm_id}`);
            setFarmName(cachedFarmDetails ? JSON.parse(cachedFarmDetails).name || "Pig Farm" : "Pig Farm");
            setRows(cachedRows ? JSON.parse(cachedRows) : []);
        }
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData, user]);

    const handleRowAdded = useCallback(() => {
        loadData();
    }, [loadData]);

    if (!user?.email) {
        return null;
    }

    return (
        <>
            <Header
                user={user}
                rows={rows}
                logout={logout}
                toggleSidebar={toggleSidebar}
                CurrencySelector={CurrencySelector}
                ThemeToggle={ThemeToggle}
                handleAddRow={handleAddRow}
                farmName={farmName}
            />
            {addRowOpen && (<AddRowDialog open={addRowOpen} onClose={() => setAddRowOpen(false)} onRowAdded={handleRowAdded} />)}
        </>
    );
};

export default ClientHeaderWrapper;