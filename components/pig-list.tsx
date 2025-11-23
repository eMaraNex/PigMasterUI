"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus, Circle, Search, Filter, Heart, Calendar, TrendingUp, Users, Crown } from "lucide-react"
import type { PigListProps, Pig as PigType } from "@/types";
import EditPigDialog from "@/components/edit-pig-dialog";
import AddKitDialog from "@/components/add-kit-dialog";
import RemovePigDialog from "@/components/remove-pig-dialog";
import { motion } from "framer-motion";
import axios from "axios";
import { useToast } from '@/lib/toast-provider';
import * as utils from "@/lib/utils";
import PigListSkeleton from "./skeletons/pigs-list/skeleton";
import AddPigDialog from "@/components/add-pig-dialog";
import Table from "./shared/table";
import Pagination from "./shared/pagination";
import { useAuth } from "@/lib/auth-context";
import FilterDialog, { type FilterOptions } from "./filter-dialog";

interface PigStatistics {
  totalPigs: number
  maleCount: number
  femaleCount: number
  pregnantCount: number
  breederBoarCount: number
  breedDistribution: Record<string, { males: number; females: number; total: number }>
}

const PigList: React.FC<PigListProps> = ({ farmId }) => {
  const { user } = useAuth();
  const [pigs, setPigs] = useState<PigType[]>([]);
  const [selectedPigs, setSelectedPigs] = useState<string[]>([]);
  const [editingPig, setEditingPig] = useState<PigType | null>(null);
  const [addKitPig, setAddKitPig] = useState<PigType | null>(null);
  const [removingPig, setRemovingPig] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [addPigOpen, setAddPigOpen] = useState<boolean>(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [statistics, setStatistics] = useState<PigStatistics>({
    totalPigs: 0,
    maleCount: 0,
    femaleCount: 0,
    pregnantCount: 0,
    breederBoarCount: 0,
    breedDistribution: {},
  })
  const isMounted = useRef(true);
  const { showSuccess, showError } = useToast();
  const handleAddPig = () => {
    setAddPigOpen(true)
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 800);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchPigs = useCallback(async () => {
    if (!user?.farm_id) return;

    setLoading(true);
    setError(null);
    try {
      let token: string | null = null;
      if (typeof window !== "undefined") {
        token = localStorage.getItem("pig_farm_token");
      }
      if (!token) throw new Error("No authentication token found");


      const response = await axios.post(
        `${utils.apiUrl}/pigs/${user?.farm_id}/details`,
        {
          page: Number(page),
          limit: Number(pageSize),
          sortField,
          sortOrder,
          searchTerm: debouncedSearchTerm?.trim() || undefined,
          filters
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const { data, pagination, statistics: apiStatistics } = response.data.data;
      setPigs(data || []);
      setTotalItems(Number(pagination?.totalItems || 0));

      // Update statistics from API response
      if (apiStatistics) {
        setStatistics(apiStatistics);
      };
    } catch (err) {
      console.error("Error fetching pigs:", err);
      setError("Failed to load pig data.");
      showError("Error", "Failed to load pig data.");
    } finally {
      setLoading(false);
    }
  }, [user?.farm_id, page, pageSize, sortField, sortOrder, debouncedSearchTerm, filters, showError]);

  useEffect(() => {
    fetchPigs();
  }, [fetchPigs]);

  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) return;
    if (page !== 1) {
      setPage(1);
    }
  }, [debouncedSearchTerm, searchTerm]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(Number(newPage));
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(Number(newPageSize));
    setPage(1);
  }, []);

  const handleEdit = useCallback((pig: PigType) => {
    setEditingPig(pig);
  }, []);

  const handleAddKit = useCallback(
    (pig: PigType) => {
      if (!pig.is_pregnant) {
        showError("Error", "Cannot add kit records because the pig has not been pregnant.")
        return
      }
      setAddKitPig(pig)
    },
    [showError],
  )

  const handleDelete = useCallback((pig: PigType) => {
    // Transform pig data to match the expected format for RemovePigDialog
    const pigForRemoval = {
      id: pig.id,
      pig_id: pig.pig_id || "",
      name: pig.name || "Unnamed",
      hutch_id: pig.hutch_id,
      gender: pig.gender || "unknown",
      breed: pig.breed || "Unknown",
      weight: pig.weight || 0,
      birth_date: pig.birth_date,
    }
    setRemovingPig(pigForRemoval)
  }, [])

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setPage(1);
  }, [sortField, sortOrder]);

  const refetchPigs = useCallback(async () => {
    await fetchPigs();
  }, [fetchPigs]);

  const handleApplyFilters = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters)
    setPage(1);
  }, []);

  // Use statistics from API instead of calculating from paginated data
  const safePigs = Array.isArray(pigs) ? pigs : [];
  const { totalPigs, maleCount, femaleCount, pregnantCount, breederBoarCount, breedDistribution } = statistics;
  const availableBreeds = Object.keys(breedDistribution);

  // Table configuration
  const tableColumns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (value: string, row: PigType) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
            <Circle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{value || "Unnamed"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">ID: {(row?.pig_id ?? "").slice(0, 8)}...</p>
          </div>
        </div>
      ),
    },
    {
      key: "gender",
      label: "Gender",
      sortable: true,
      render: (value: string) => (
        <Badge
          variant="secondary"
          className={`capitalize ${value === "male"
            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
            : "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300"
            }`}
        >
          {value}
        </Badge>
      ),
    },
    {
      key: "breed",
      label: "Breed",
      sortable: true,
      render: (value: string) => <span className="text-gray-700 dark:text-gray-300 font-medium">{value}</span>,
    },
    {
      key: "litters",
      label: "Litters",
      render: (value: any, row: PigType) => (
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{row?.birth_history?.length || 0}</span>
          <Calendar className="h-4 w-4 text-gray-400" />
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: any, row: PigType) =>
        row.is_pregnant ? (
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm">
            <Heart className="h-3 w-3 mr-1" />
            Pregnant
          </Badge>
        ) : null,
    },
  ]

  const tableActions = [
    {
      label: "Edit",
      icon: Pencil,
      onClick: handleEdit,
      className: "hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    {
      label: "Add Kit",
      icon: Plus,
      onClick: handleAddKit,
      condition: (row: PigType) => row.gender !== "male",
      className: "hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400",
    },
    {
      label: "Remove",
      icon: Trash2,
      onClick: handleDelete,
      className: "hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400",
    },
  ]

  const emptyState = {
    title: debouncedSearchTerm ? "No pigs found" : "No pigs yet",
    description: debouncedSearchTerm
      ? `No pigs match "${debouncedSearchTerm}". Try adjusting your search.`
      : "Start building your colony by adding your first pig!",
    action: !debouncedSearchTerm
      ? {
        label: "Add Your First Pig",
        onClick: handleAddPig,
      }
      : undefined,
  }

  if (loading) {
    return <PigListSkeleton farmId={farmId} />
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[400px] flex items-center justify-center"
      >
        <div className="text-center space-y-4 p-8 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto">
            <Circle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Oops! Something went wrong</h3>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300"
          >
            Try Again
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Circle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Pig Colony</h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Manage your pig farm efficiently
                </p>
              </div>
            </div>
          </div>
          {/* Stats Cards - Now using API statistics */}
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-2">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-3 sm:p-4 min-w-[90px] sm:min-w-[120px]">
              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-[10px] sm:text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                  Total
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-blue-900 dark:text-blue-100">{totalPigs}</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-3 sm:p-4 min-w-[90px] sm:min-w-[120px]">
              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                <span className="text-[10px] sm:text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wide">
                  Pregnant
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-green-900 dark:text-green-100">{pregnantCount}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-3 sm:p-4 min-w-[90px] sm:min-w-[120px]">
              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-[10px] sm:text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                  Breeders
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-purple-900 dark:text-purple-100">{breederBoarCount}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-3 sm:p-4 min-w-[90px] sm:min-w-[120px]">
              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 dark:text-orange-400" />
                <span className="text-[10px] sm:text-xs font-medium text-orange-700 dark:text-orange-300 uppercase tracking-wide">
                  M/F
                </span>
              </div>
              <p className="text-sm sm:text-lg font-bold text-orange-900 dark:text-orange-100">
                {maleCount}/{femaleCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Breed Statistics - Now using API statistics */}
      {Object.keys(breedDistribution).length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Breed Distribution</h3>
          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-2" style={{ minWidth: "max-content" }}>
              {Object.entries(breedDistribution).map(([breed, stats]) => (
                <div key={breed} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 min-w-[200px] flex-shrink-0">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{breed}</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600 dark:text-blue-400">Males: {stats.males}</span>
                    <span className="text-pink-600 dark:text-pink-400">Females: {stats.females}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total: {stats.total}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Controls Section */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search pigs by name, breed, or ID (e.g., KA-022)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500 rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedPigs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-xl"
              >
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {selectedPigs.length} selected
                </span>
                <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-blue-600 hover:text-blue-800">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </motion.div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-gray-200 dark:border-gray-700 bg-transparent"
              onClick={() => setFilterDialogOpen(true)}
            >
              <Filter className="h-3 w-3 mr-1" />
              Filter
            </Button>
            <Button
              onClick={handleAddPig}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-2 py-1 text-xs shadow-lg flex-1 max-w-[110px]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Pig
            </Button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <Table
        data={safePigs}
        columns={tableColumns}
        actions={tableActions}
        loading={loading}
        selectable={true}
        selectedItems={selectedPigs}
        onSelectionChange={setSelectedPigs}
        idField="pig_id"
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyState={emptyState}
        className="rounded-3xl"
      />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={[5, 10, 15, 20, 30, 50]}
        showPageSizeSelector={true}
        showItemsInfo={true}
        currentPageItems={safePigs?.length ?? 0}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800"
      />

      {/* Dialogs */}
      {editingPig && (
        <EditPigDialog
          pig={editingPig}
          onClose={() => setEditingPig(null)}
          onUpdate={() => {
            setEditingPig(null)
            refetchPigs()
          }}
        />
      )}
      {addKitPig && (
        <AddKitDialog
          pig={addKitPig}
          sowId={addKitPig.pig_id ?? ""}
          boarId=""
          sowName={addKitPig.name}
          onClose={() => setAddKitPig(null)}
          onKitAdded={() => {
            setAddKitPig(null)
            refetchPigs()
          }}
        />
      )}

      {removingPig && (
        <RemovePigDialog
          hutch_id={removingPig.hutch_id}
          hutch_name={`Hutch ${removingPig.hutch_id}`}
          pig={removingPig}
          onClose={() => setRemovingPig(null)}
          onRemovalSuccess={() => {
            setRemovingPig(null)
            refetchPigs()
          }}
        />
      )}
      {addPigOpen && (
        <AddPigDialog
          customHutches={true}
          hutch_id={""}
          onClose={() => setAddPigOpen(false)}
          onPigAdded={(newPig) => {
            setAddPigOpen(false)
            refetchPigs()
            showSuccess("Success", `Pig ${newPig.pig_id} added successfully!`)
          }}
        />
      )}

      <FilterDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
        availableBreeds={availableBreeds}
      />
    </motion.div>
  );
};

export default PigList;
