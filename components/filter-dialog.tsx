"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Filter, X } from "lucide-react"

export interface FilterOptions {
    gender?: string[]
    breed?: string[]
    isPregnant?: boolean
    ageRange?: string
}

interface FilterDialogProps {
    open: boolean
    onClose: () => void
    onApplyFilters: (filters: FilterOptions) => void
    currentFilters: FilterOptions
    availableBreeds: string[]
}

const FilterDialog: React.FC<FilterDialogProps> = ({
    open,
    onClose,
    onApplyFilters,
    currentFilters,
    availableBreeds,
}) => {
    const [filters, setFilters] = useState<FilterOptions>(currentFilters)

    useEffect(() => {
        setFilters(currentFilters)
    }, [currentFilters])

    const handleApply = () => {
        onApplyFilters(filters)
        onClose()
    }

    const handleClear = () => {
        const clearedFilters = {}
        setFilters(clearedFilters)
        onApplyFilters(clearedFilters)
        onClose()
    }

    const handleClose = () => {
        setFilters(currentFilters) // Reset to current filters on cancel
        onClose()
    }

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="sm:max-w-[425px] bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-white/20 dark:border-gray-600/20 shadow-2xl"
          onInteractOutside={e => e.preventDefault()}
          onPointerDownOutside={e => e.preventDefault()}
        >
          <DialogHeader className="bg-gradient-to-r from-blue-50/80 to-purple-100/80 dark:from-blue-900/30 dark:to-purple-800/30 -m-6 mb-6 p-6 rounded-t-lg border-b border-blue-200 dark:border-blue-700">
            <DialogTitle className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <Filter className="h-5 w-5" />
              <span>Filter Pigs</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Gender Filter */}
            <div className="space-y-2">
              <Label
                htmlFor="gender"
                className="text-gray-900 dark:text-gray-100"
              >
                Gender
              </Label>
              <Select
                value={filters.gender?.[0] || "all"}
                onValueChange={value =>
                  setFilters({
                    ...filters,
                    gender: value === "all" ? undefined : [value],
                  })
                }
              >
                <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="All genders" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="all">All genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Breed Filter */}
            <div className="space-y-2">
              <Label
                htmlFor="breed"
                className="text-gray-900 dark:text-gray-100"
              >
                Breed
              </Label>
              <Select
                value={filters.breed?.[0] || "all"}
                onValueChange={value =>
                  setFilters({
                    ...filters,
                    breed: value === "all" ? undefined : [value],
                  })
                }
              >
                <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="All breeds" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="all">All breeds</SelectItem>
                  {availableBreeds.map(breed => (
                    <SelectItem key={breed} value={breed}>
                      {breed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pregnancy Status */}
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-gray-100">
                Pregnancy Status
              </Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pregnant"
                  checked={filters.isPregnant === true}
                  onCheckedChange={checked =>
                    setFilters({
                      ...filters,
                      isPregnant: checked ? true : undefined,
                    })
                  }
                  className="border-gray-300 dark:border-gray-600"
                />
                <Label
                  htmlFor="pregnant"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  Show only pregnant pigs
                </Label>
              </div>
            </div>

            {/* Age Range Filter */}
            <div className="space-y-2">
              <Label
                htmlFor="ageRange"
                className="text-gray-900 dark:text-gray-100"
              >
                Age Range
              </Label>
              <Select
                value={filters.ageRange || "all"}
                onValueChange={value =>
                  setFilters({
                    ...filters,
                    ageRange: value === "all" ? undefined : value,
                  })
                }
              >
                <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="All ages" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="all">All ages</SelectItem>
                  <SelectItem value="young">Young (0-6 months)</SelectItem>
                  <SelectItem value="adult">Adult (6-24 months)</SelectItem>
                  <SelectItem value="senior">Senior (24+ months)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex justify-between gap-2 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleApply}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
}

export default FilterDialog