"use client";

import React, { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/shared/header";
import CurrencySelector from "@/components/currency-selector";
import ThemeToggle from "@/components/theme-toggle";
import AddRowDialog from "./add-row-dialog";
import { api, useGetFarmQuery, useGetRowsQuery, emptyList } from "@/lib/redux/api";
import { useAppDispatch } from "@/lib/redux/hooks";

const ClientHeaderWrapper: React.FC = () => {
    const { user, logout } = useAuth();
    const dispatch = useAppDispatch();
    const [addRowOpen, setAddRowOpen] = useState(false);
    const { data: rows = emptyList() } = useGetRowsQuery(user?.farm_id ?? "", { skip: !user?.farm_id });
    const { data: farm } = useGetFarmQuery(user?.farm_id ?? "", { skip: !user?.farm_id });

    const handleAddRow = useCallback(() => setAddRowOpen(true), []);
    const handleRowAdded = useCallback(() => {
        if (user?.farm_id) {
            dispatch(api.util.invalidateTags([{ type: "Rows", id: user.farm_id }]));
        }
    }, [dispatch, user?.farm_id]);

    if (!user?.email) return null;

    return (
        <>
            <Header
                user={user}
                rows={rows}
                logout={logout}
                CurrencySelector={CurrencySelector}
                ThemeToggle={ThemeToggle}
                handleAddRow={handleAddRow}
                farmName={farm?.name || "Pig Farm"}
            />
            {addRowOpen && (
                <AddRowDialog
                    open={addRowOpen}
                    onClose={() => setAddRowOpen(false)}
                    onRowAdded={handleRowAdded}
                />
            )}
        </>
    );
};

export default ClientHeaderWrapper;
