"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Building, Grid3X3, Layers, Info } from "lucide-react"
import PenLayoutVisualization from "@/components/pen-layout-visualization"

interface RowTutorialModalProps {
  open: boolean
  onCreateRow: () => void
}

export default function RowTutorialModal({ open, onCreateRow }: RowTutorialModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={() => { }}
    >
      <DialogContent
        className="sm:max-w-2xl bg-white dark:bg-gray-900 rounded-lg max-h-[80vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
            <Building className="h-6 w-6 text-green-600" />
            Create Your First Row
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">What is a Row?</h3>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  A row is a block structure that contains multiple pens (cages) on a single or multiple levels,  where you'll house your pigs.
                  Think of it as an organized housing unit for your farm.
                </p>
              </div>
            </div>
          </div>

          <PenLayoutVisualization capacity={12} levels={3} />

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Layers className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Row Levels</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Each row can have 1-4 levels (A, B, C, D) stacked vertically. Levels are like the block floors that you have vertically.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Grid3X3 className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Pens Distribution</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pens are evenly distributed across levels. For example: 15 total pens with 3 levels = 5 pens
                  per level (A1-A5, B1-B5, C1-C5).
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border-amber-200 dark:border-amber-800">
            <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2">Example Configuration</h4>
            <div className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
              <p>
                • <strong>Row Name:</strong> Mercury (or custom name)
              </p>
              <p>
                • <strong>Capacity:</strong> 12 pens total
              </p>
              <p>
                • <strong>Levels:</strong> 3 levels (A, B, C)
              </p>
              <p>
                • <strong>Distribution:</strong> 4 pens per level
              </p>
              <p>
                • <strong>Result:</strong> A1-A4, B1-B4, C1-C4
              </p>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">
              ⚠️ You must create at least one row before you can add pigs to your farm.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={onCreateRow}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
          >
            Create My First Row
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
