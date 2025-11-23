"use client"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface HutchLayoutVisualizationProps {
  capacity?: number
  levels?: number
  className?: string
}

export default function HutchLayoutVisualization({
  capacity = 12,
  levels = 3,
  className,
}: HutchLayoutVisualizationProps) {
  const [animatedHutches, setAnimatedHutches] = useState<Set<string>>(new Set())

  const hutchesPerLevel = Math.floor(capacity / levels)
  const levelNames = Array.from({ length: levels }, (_, i) => String.fromCharCode(65 + i)) // A, B, C...

  useEffect(() => {
    // Animate hutches appearing one by one
    const timer = setTimeout(() => {
      const allHutches: string[] = []
      levelNames.forEach((level) => {
        for (let i = 1; i <= hutchesPerLevel; i++) {
          allHutches.push(`${level}${i}`)
        }
      })

      allHutches.forEach((hutch, index) => {
        setTimeout(() => {
          setAnimatedHutches((prev) => new Set([...prev, hutch]))
        }, index * 100)
      })
    }, 500)

    return () => clearTimeout(timer)
  }, [capacity, levels, hutchesPerLevel, levelNames])

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border-2 border-dashed border-blue-200 dark:border-gray-600">
        <div className="text-center mb-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Row Structure Preview</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {capacity} hutches across {levels} levels
          </p>
        </div>

        <div className="space-y-3">
          {levelNames.map((level, levelIndex) => (
            <div key={level} className="relative">
              {/* Level Label */}
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  {level}
                </div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Level {level} ({hutchesPerLevel} hutches)
                </div>
              </div>

              {/* Hutches Grid */}
              <div className="grid grid-cols-4 gap-2 ml-11">
                {Array.from({ length: hutchesPerLevel }, (_, hutchIndex) => {
                  const hutchId = `${level}${hutchIndex + 1}`
                  const isAnimated = animatedHutches.has(hutchId)

                  return (
                    <div
                      key={hutchId}
                      className={cn(
                        "relative h-12 rounded-lg border-2 transition-all duration-300 transform",
                        isAnimated
                          ? "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border-amber-300 dark:border-amber-600 scale-100 opacity-100"
                          : "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 scale-95 opacity-50",
                      )}
                      style={{
                        animationDelay: `${(levelIndex * hutchesPerLevel + hutchIndex) * 100}ms`,
                      }}
                    >
                      {/* Hutch Door */}
                      <div
                        className={cn(
                          "absolute inset-1 rounded border transition-colors duration-300",
                          isAnimated
                            ? "bg-white dark:bg-gray-800 border-amber-200 dark:border-amber-700"
                            : "bg-gray-200 dark:bg-gray-600 border-gray-400 dark:border-gray-500",
                        )}
                      >
                        {/* Hutch ID */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span
                            className={cn(
                              "text-xs font-bold transition-colors duration-300",
                              isAnimated ? "text-amber-700 dark:text-amber-300" : "text-gray-500 dark:text-gray-400",
                            )}
                          >
                            {hutchId}
                          </span>
                        </div>

                        {/* Water Bottle & Feeder Icons */}
                        {isAnimated && (
                          <div className="absolute top-0.5 right-0.5 flex gap-0.5">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" title="Water bottle" />
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" title="Feeder" />
                          </div>
                        )}
                      </div>

                      {/* 3D Effect Shadow */}
                      <div
                        className={cn(
                          "absolute -bottom-1 -right-1 w-full h-full rounded-lg transition-all duration-300",
                          isAnimated ? "bg-amber-200/50 dark:bg-amber-800/30" : "bg-gray-300/50 dark:bg-gray-600/30",
                        )}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              <span>Water</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>Food</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-300 rounded" />
              <span>Hutch</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
