"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, Calendar, Filter, Download, Trash2 } from "lucide-react";
import { useCurrency } from "@/lib/currency-context";
import { useAuth } from "@/lib/auth-context";
import axios from "axios";
import * as utils from "@/lib/utils";
import type { EarningsRecord, ProductionRecord } from "@/types";
import { useToast } from "@/lib/toast-provider";

export default function EarningsTracker() {
  const { currency, formatAmount, convertToBaseCurrency, getCurrencySymbol } = useCurrency();
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EarningsRecord[]>([]);
  const [production, setProduction] = useState<ProductionRecord[]>([]);
  const [filteredEarnings, setFilteredEarnings] = useState<EarningsRecord[]>([]);
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });
  const [addEarningsOpen, setAddEarningsOpen] = useState(false);
  const [addProductionOpen, setAddProductionOpen] = useState(false);
  const { showSuccess, showError, showWarn } = useToast();

  const [earningsForm, setEarningsForm] = useState<{
    type: "pig_sale" |"manure_sale" | "other";
    pig_id?: string;
    hutch_id?: string;
    amount: string;
    date: string;
    weight?: string;
    sale_type?: "whole" | "meat_only" | "skin_only" | "meat_and_skin" | "bulk" | "processed" | "other";
    includes_urine?: boolean;
    includes_manure?: boolean;
    buyer_name?: string;
    notes: string;
  }>({
    type: "other",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    sale_type: "other",
  });

  const [productionForm, setProductionForm] = useState({
    type: "urine" as const,
    quantity: "",
    unit: "liters",
    date: new Date().toISOString().split("T")[0],
    source: "",
    notes: "",
    sellImmediately: false,
    salePrice: "",
    buyerName: "",
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteEarning = async (earningId: string) => {
    if (!user?.farm_id) return;
    setDeletingId(earningId);
    try {
      await axios.delete(`${utils.apiUrl}/earnings/${user.farm_id}/${earningId}`);
      loadEarnings();
    } catch (error) {
      console.error("Error deleting earning:", error);
    } finally {
      setDeletingId(null);
    }
  }

  const getSaleTypeOptions = (earningType: string) => {
    switch (earningType) {
      case "pig_sale":
        return [
          { value: "whole", label: "Whole Pig" },
          { value: "meat_only", label: "Meat Only" },
          { value: "skin_only", label: "Skin Only" },
          { value: "meat_and_skin", label: "Meat and Skin" },
        ];
      case "manure_sale":
        return [
          { value: "bulk", label: "Bulk Sale" },
          { value: "processed", label: "Processed" },
          { value: "other", label: "Other" },
        ];
      default:
        return [
          { value: "other", label: "Other" },
          { value: "bulk", label: "Bulk" },
          { value: "processed", label: "Processed" },
        ];
    }
  };

  // Auto-set sale_type based on earning type
  const getDefaultSaleType = (earningType: string) => {
    switch (earningType) {
      case "pig_sale":
        return "whole";
      case "manure_sale":
        return "bulk";
      default:
        return "other";
    }
  };

  useEffect(() => {
    if (user?.farm_id) {
      loadEarnings();
      loadProduction();
    }
  }, [user?.farm_id]);

  // When the date filter or custom date range changes we request server-side filtered data
  useEffect(() => {
    // If user isn't loaded, bail
    if (!user?.farm_id) return;

    // If the filter is 'all' just fetch everything from server
    if (dateFilter === 'all') {
      loadEarnings();
      return;
    }

    // For other filters compute date_from/date_to and call loadEarnings
    const now = new Date();
    let date_from: string | undefined;
    let date_to: string | undefined;

    const fmt = (d: Date) => d.toISOString().split('T')[0];

    switch (dateFilter) {
      case 'today':
        date_from = fmt(now);
        date_to = fmt(now);
        break;
      case 'week':
        date_from = fmt(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
        date_to = fmt(now);
        break;
      case 'month':
        date_from = fmt(new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()));
        date_to = fmt(now);
        break;
      case 'year':
        date_from = fmt(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()));
        date_to = fmt(now);
        break;
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          date_from = customDateRange.start;
          date_to = customDateRange.end;
        }
        break;
    }

    loadEarnings({ date_from, date_to });
  }, [dateFilter, customDateRange, user?.farm_id]);

  const loadEarnings = async (filters = {}) => {
    try {
      const token = localStorage.getItem("pig_farm_token");
      if (!token) {
        showError('Error', "No authentication token found")
      }

      const params = new URLSearchParams();
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      // optional: accept filters.type etc in the future

      const url = `${utils.apiUrl}/earnings/${user?.farm_id}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEarnings(response.data.data || []);
      setFilteredEarnings(response.data.data || []);
    } catch (error) {
      showError('Error', error?.toString())
      setEarnings([]);
    }
  };

  const loadProduction = () => {
    const productionData = JSON.parse(localStorage.getItem(`pig_farm_production_${user?.farm_id}`) || "[]");
    setProduction(productionData);
  };

  const saveProductionToStorage = (data: ProductionRecord[]) => {
    localStorage.setItem(`pig_farm_production_${user?.farm_id}`, JSON.stringify(data));
  };

  const filterEarnings = () => {
    let filtered = [...earnings];
    const now = new Date();

    switch (dateFilter) {
      case "today":
        filtered = earnings.filter((e) => {
          const earningDate = new Date(e.date);
          return earningDate.toDateString() === now.toDateString();
        });
        break;
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = earnings.filter((e) => new Date(e.date) >= weekAgo);
        break;
      case "month":
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        filtered = earnings.filter((e) => new Date(e.date) >= monthAgo);
        break;
      case "year":
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        filtered = earnings.filter((e) => new Date(e.date) >= yearAgo);
        break;
      case "custom":
        if (customDateRange.start && customDateRange.end) {
          filtered = earnings.filter((e) => {
            const earningDate = new Date(e.date);
            return earningDate >= new Date(customDateRange.start) && earningDate <= new Date(customDateRange.end);
          });
        }
        break;
    }

    setFilteredEarnings(filtered);
  };

  const handleAddEarnings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.farm_id) {
      showWarn('Error', "Missing farm ID. Please try again.");
      return;
    }

    try {
      const token = localStorage.getItem("pig_farm_token");
      if (!token) {
        showError('Error', "No authentication token found")
      }
      const finalSaleType = earningsForm.sale_type || getDefaultSaleType(earningsForm.type);
      const newEarning: EarningsRecord = {
        type: earningsForm.type,
        pig_id: earningsForm.pig_id,
        hutch_id: earningsForm.hutch_id,
        weight: earningsForm.weight ? Number.parseFloat(earningsForm.weight) : 0,
        sale_type: finalSaleType,
        includes_urine: earningsForm.includes_urine || false,
        includes_manure: earningsForm.includes_manure || false,
        buyer_name: earningsForm.buyer_name,
        amount: Number.parseFloat(earningsForm.amount),
        currency: currency,
        date: earningsForm.date,
        notes: earningsForm.notes || '',
        farm_id: user.farm_id,
      };

      await axios.post(`${utils.apiUrl}/earnings/${user.farm_id}`, newEarning, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedEarnings = [...earnings, newEarning];
      setEarnings(updatedEarnings);
      setEarningsForm({
        type: "other",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
        sale_type: "other",
      });
      setAddEarningsOpen(false);
      showSuccess('Success', 'Earnings record added successfully!');
    } catch (error: any) {
      showError('Error', error.response?.data?.message);
    }
  };

  const handleAddProduction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.farm_id) {
      showWarn('Error', "Missing farm ID. Please try again.");
      return;
    }

    const newProduction: ProductionRecord = {
      type: productionForm.type,
      quantity: Number.parseFloat(productionForm.quantity),
      unit: productionForm.unit,
      date: productionForm.date,
      source: productionForm.source,
      notes: productionForm.notes,
    };

    const updatedProduction = [...production, newProduction];
    setProduction(updatedProduction);
    saveProductionToStorage(updatedProduction);

    if (productionForm.sellImmediately && productionForm.salePrice) {
      try {
        const token = localStorage.getItem("pig_farm_token");
        if (!token) {
          showError('Error', "No authentication token found")
        }

        const saleEarning: EarningsRecord = {
          type: productionForm.type === "urine" ? "urine_sale" : "manure_sale",
          amount: Number.parseFloat(productionForm.salePrice),
          currency: currency,
          date: productionForm.date,
          sale_type: "bulk",
          buyer_name: productionForm.buyerName || "",
          notes: `Sale of ${productionForm.quantity} ${productionForm.unit} ${productionForm.type}${productionForm.buyerName ? ` to ${productionForm.buyerName}` : ""}`,
          farm_id: user.farm_id,
        };

        await axios.post(`${utils.apiUrl}/earnings/${user.farm_id}`, saleEarning, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const updatedEarnings = [...earnings, saleEarning];
        setEarnings(updatedEarnings);
        showSuccess('Success', 'Production and sale recorded successfully!');
      } catch (error: any) {
        showError('Error', 'Error adding production sale earnings')
      }
    }

    setProductionForm({
      type: "urine",
      quantity: "",
      unit: "liters",
      date: new Date().toISOString().split("T")[0],
      source: "",
      notes: "",
      sellImmediately: false,
      salePrice: "",
      buyerName: "",
    });
    setAddProductionOpen(false);
  };

  const getTotalEarnings = () => {
    return filteredEarnings.reduce((total, earning) => {
      const amountInBase = convertToBaseCurrency(earning.amount, earning.currency as any);
      return total + amountInBase;
    }, 0);
  };

  const getEarningsByType = () => {
    const types = {
      pig_sale: 0,
      urine_sale: 0,
      manure_sale: 0,
      other: 0,
    };

    filteredEarnings.forEach((earning) => {
      const amountInBase = convertToBaseCurrency(earning.amount, earning.currency as any);
      types[earning.type] += amountInBase;
    });

    return types;
  };

  const earningsByType = getEarningsByType();

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-100">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
              {formatAmount(getTotalEarnings())}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {dateFilter === "all" ? "All time" : `${dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)} period`}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-100">Pig Sales</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-red-600 dark:from-pink-400 dark:to-red-400 bg-clip-text text-transparent">
              {formatAmount(earningsByType.pig_sale)}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {filteredEarnings.filter((e) => e.type === "pig_sale").length} sales
            </p>
          </CardContent>
        </Card>

        {/* <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-100">Urine Sales</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent">
              {formatAmount(earningsByType.urine_sale)}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {production.filter((p) => p.type === "urine").reduce((sum, p) => sum + p.quantity, 0)} liters produced
            </p>
          </CardContent>
        </Card> */}

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300 sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-100">Manure Sales</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 dark:from-green-400 dark:to-teal-400 bg-clip-text text-transparent">
              {formatAmount(earningsByType.manure_sale)}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {production.filter((p) => p.type === "manure").reduce((sum, p) => sum + p.quantity, 0)} kg produced
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-gray-900 dark:text-gray-100 text-base sm:text-lg">Filters & Actions</span>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Dialog open={addProductionOpen} onOpenChange={setAddProductionOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 w-full sm:w-auto"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="text-xs sm:text-sm">Add Production</span>
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-white/20 dark:border-gray-600/20 max-h-[90vh] overflow-y-auto w-[95vw] max-w-lg"
                  onInteractOutside={(e) => e.preventDefault()}
                  onPointerDownOutside={(e) => e.preventDefault()}
                >
                  <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                      Add Production Record
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddProduction} className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Type</Label>
                        <Select
                          value={productionForm.type}
                          onValueChange={(value: any) =>
                            setProductionForm({
                              ...productionForm,
                              type: value,
                            })
                          }
                        >
                          <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                            <SelectItem value="urine">Urine</SelectItem>
                            <SelectItem value="manure">Manure</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Quantity</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={productionForm.quantity}
                          onChange={(e) =>
                            setProductionForm({
                              ...productionForm,
                              quantity: e.target.value,
                            })
                          }
                          className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Unit</Label>
                        <Select
                          value={productionForm.unit}
                          onValueChange={(value) =>
                            setProductionForm({
                              ...productionForm,
                              unit: value,
                            })
                          }
                        >
                          <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                            <SelectItem value="liters">Liters</SelectItem>
                            <SelectItem value="kg">Kilograms</SelectItem>
                            <SelectItem value="bags">Bags</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Date</Label>
                        <Input
                          type="date"
                          value={productionForm.date}
                          onChange={(e) =>
                            setProductionForm({
                              ...productionForm,
                              date: e.target.value,
                            })
                          }
                          className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">
                        Source (Hutch/Pig ID)
                      </Label>
                      <Input
                        value={productionForm.source}
                        onChange={(e) =>
                          setProductionForm({
                            ...productionForm,
                            source: e.target.value,
                          })
                        }
                        className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                        placeholder="e.g., Mercury-A1 or RB-001"
                      />
                    </div>

                    {/* Sale Option */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3 sm:pt-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={productionForm.sellImmediately}
                          onChange={(e) =>
                            setProductionForm({
                              ...productionForm,
                              sellImmediately: e.target.checked,
                            })
                          }
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                          Sell Immediately
                        </span>
                      </label>
                    </div>
                    {productionForm.sellImmediately && (
                      <div className="bg-gradient-to-r from-green-50/80 to-green-100/80 dark:from-green-900/30 dark:to-green-800/30 p-3 sm:p-4 rounded-lg border border-green-200 dark:border-green-700 space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">
                              Sale Price ({getCurrencySymbol(currency)})
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={productionForm.salePrice}
                              onChange={(e) =>
                                setProductionForm({
                                  ...productionForm,
                                  salePrice: e.target.value,
                                })
                              }
                              className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                              required={productionForm.sellImmediately}
                            />
                          </div>
                          <div>
                            <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Buyer Name</Label>
                            <Input
                              value={productionForm.buyerName}
                              onChange={(e) =>
                                setProductionForm({
                                  ...productionForm,
                                  buyerName: e.target.value,
                                })
                              }
                              className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                              placeholder="Buyer Name"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    <div>
                      <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Notes</Label>
                      <Textarea
                        value={productionForm.notes}
                        onChange={(e) =>
                          setProductionForm({
                            ...productionForm,
                            notes: e.target.value,
                          })
                        }
                        className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                        rows={2}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAddProductionOpen(false)}
                        className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-xs sm:text-sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-xs sm:text-sm"
                      >
                        {productionForm.sellImmediately ? "Add Production & Sale" : "Add Production"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={addEarningsOpen} onOpenChange={setAddEarningsOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white w-full sm:w-auto">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="text-xs sm:text-sm">Add Earnings</span>
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-white/20 dark:border-gray-600/20 max-h-[90vh] overflow-y-auto w-[95vw] max-w-lg"
                  onInteractOutside={(e) => e.preventDefault()}
                  onPointerDownOutside={(e) => e.preventDefault()}
                >
                  <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                      Add Earnings Record
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddEarnings} className="space-y-3 sm:space-y-4">
                    <div>
                      <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Type</Label>
                      <Select
                        value={earningsForm.type}
                        onValueChange={(value: "pig_sale" | "manure_sale" | "other") =>
                          setEarningsForm({
                            ...earningsForm,
                            type: value,
                            sale_type: getDefaultSaleType(value),
                            ...(value !== "pig_sale" && {
                              pig_id: undefined,
                              hutch_id: undefined,
                              weight: undefined,
                              includes_urine: undefined,
                              includes_manure: undefined,
                              buyer_name: undefined,
                            }),
                          })
                        }
                      >
                        <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-xs sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                          <SelectItem value="pig_sale">Pig Sale</SelectItem>
                          <SelectItem value="manure_sale">Manure Sale</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sale Type - Always show for all types */}
                    <div>
                      <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Sale Type</Label>
                      <Select
                        value={earningsForm.sale_type}
                        onValueChange={(
                          value: "whole" | "meat_only" | "skin_only" | "meat_and_skin" | "bulk" | "processed" | "other",
                        ) => setEarningsForm({ ...earningsForm, sale_type: value })}
                      >
                        <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-xs sm:text-sm">
                          <SelectValue placeholder="Select sale type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                          {getSaleTypeOptions(earningsForm.type).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {earningsForm.type === "pig_sale" && (
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Pig ID</Label>
                          <Input
                            value={earningsForm.pig_id || ""}
                            onChange={(e) =>
                              setEarningsForm({
                                ...earningsForm,
                                pig_id: e.target.value,
                              })
                            }
                            className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                            placeholder="e.g., RB-001"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Hutch ID</Label>
                          <Input
                            value={earningsForm.hutch_id || ""}
                            onChange={(e) =>
                              setEarningsForm({
                                ...earningsForm,
                                hutch_id: e.target.value,
                              })
                            }
                            className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                            placeholder="e.g., Mercury-A1"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Weight (kg)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={earningsForm.weight || ""}
                            onChange={(e) =>
                              setEarningsForm({
                                ...earningsForm,
                                weight: e.target.value,
                              })
                            }
                            className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                            placeholder="e.g., 2.5"
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={earningsForm.includes_urine || false}
                              onChange={(e) =>
                                setEarningsForm({
                                  ...earningsForm,
                                  includes_urine: e.target.checked,
                                })
                              }
                              className="rounded border-gray-300 dark:border-gray-600"
                            />
                            <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100">Includes Urine</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={earningsForm.includes_manure || false}
                              onChange={(e) =>
                                setEarningsForm({
                                  ...earningsForm,
                                  includes_manure: e.target.checked,
                                })
                              }
                              className="rounded border-gray-300 dark:border-gray-600"
                            />
                            <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100">Includes Manure</span>
                          </label>
                        </div>
                        <div>
                          <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Buyer Name</Label>
                          <Input
                            value={earningsForm.buyer_name || ""}
                            onChange={(e) =>
                              setEarningsForm({
                                ...earningsForm,
                                buyer_name: e.target.value,
                              })
                            }
                            className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                            placeholder="Buyer Name"
                          />
                        </div>
                      </div>
                    )}

                    {( earningsForm.type === "manure_sale") && (
                      <div>
                        <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Buyer Name</Label>
                        <Input
                          value={earningsForm.buyer_name || ""}
                          onChange={(e) =>
                            setEarningsForm({
                              ...earningsForm,
                              buyer_name: e.target.value,
                            })
                          }
                          className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                          placeholder="Buyer Name"
                        />
                      </div>
                    )}

                    <div>
                      <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">
                        Amount ({getCurrencySymbol(currency)})
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={earningsForm.amount}
                        onChange={(e) =>
                          setEarningsForm({
                            ...earningsForm,
                            amount: e.target.value,
                          })
                        }
                        className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Date</Label>
                      <Input
                        type="date"
                        value={earningsForm.date}
                        onChange={(e) =>
                          setEarningsForm({
                            ...earningsForm,
                            date: e.target.value,
                          })
                        }
                        className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Notes</Label>
                      <Textarea
                        value={earningsForm.notes}
                        onChange={(e) =>
                          setEarningsForm({
                            ...earningsForm,
                            notes: e.target.value,
                          })
                        }
                        className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                        rows={3}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAddEarningsOpen(false)}
                        className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-xs sm:text-sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-xs sm:text-sm"
                      >
                        Add Earnings
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 sm:gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dateFilter === "custom" && (
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <Input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) =>
                    setCustomDateRange({
                      ...customDateRange,
                      start: e.target.value,
                    })
                  }
                  className="w-full sm:w-40 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                />
                <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">to</span>
                <Input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) =>
                    setCustomDateRange({
                      ...customDateRange,
                      end: e.target.value,
                    })
                  }
                  className="w-full sm:w-40 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                />
              </div>
            )}
            <Button
              variant="outline"
              className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 w-full sm:w-auto"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              <span className="text-xs sm:text-sm">Export</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Earnings List */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-gray-900 dark:text-gray-100 text-base sm:text-lg">Earnings Records</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {filteredEarnings.length > 0 ? (
              filteredEarnings
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((earning, index) => (
                  <div
                    key={`${earning.id || index}-${earning.created_at || earning.date}`}
                    className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60 space-y-3 lg:space-y-0"
                  >
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
                        <Badge
                          variant="outline"
                          className={`w-fit text-xs whitespace-nowrap ${
                            earning.type === "pig_sale"
                              ? "bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-700 text-pink-800 dark:text-pink-300"
                              : earning.type === "urine_sale"
                              ? "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300"
                              : earning.type === "manure_sale"
                              ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300"
                              : "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300"
                          }`}
                        >
                          {earning.type.replace("_", " ").toUpperCase()}
                        </Badge>
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                          {formatAmount(earning.amount)}
                        </span>
                        {earning.pig_id && (
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            ({earning.pig_id})
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {new Date(earning.date).toLocaleDateString()}
                        {earning.weight && ` • ${earning.weight} kg`}
                        {earning.sale_type && ` • ${earning.sale_type.replace("_", " ")}`}
                        {earning.buyer_name && ` • Buyer: ${earning.buyer_name}`}
                      </p>
                      {earning.notes && (
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1 break-words">
                          {earning.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-end lg:justify-center space-x-2 flex-shrink-0">
                      <span className="text-green-600 dark:text-green-400 text-sm">{getCurrencySymbol(currency)}</span>
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Delete Earning Record</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Are you sure you want to delete this earning record? This action cannot be undone.
                            </p>
                            <div className="flex justify-end space-x-2">
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Cancel
                                </Button>
                              </DialogTrigger>
                              <DialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteEarning(earning.id ?? '')}
                                  disabled={deletingId === earning.id}
                                >
                                  {deletingId === earning.id ? "Deleting..." : "Delete"}
                                </Button>
                              </DialogTrigger>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
                <span className="text-2xl sm:text-3xl mx-auto mb-4 opacity-50">{getCurrencySymbol(currency)}</span>
                <p className="text-sm sm:text-base">No earnings records found for the selected period.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}