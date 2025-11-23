// Simulated database using localStorage for persistence

export const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(`pig_farm_${key}`, JSON.stringify(data))
    return true
  } catch (error) {
    console.error("Error saving to storage:", error)
    return false
  }
}

export const loadFromStorage = (key: string, defaultValue: any = []) => {
  try {
    const stored = localStorage.getItem(`pig_farm_${key}`)
    return stored ? JSON.parse(stored) : defaultValue
  } catch (error) {
    console.error("Error loading from storage:", error)
    return defaultValue
  }
}

export const removeFromStorage = (key: string) => {
  try {
    localStorage.removeItem(`pig_farm_${key}`)
    return true
  } catch (error) {
    console.error("Error removing from storage:", error)
    return false
  }
}

// Initialize storage with default data if empty
export const initializeStorage = () => {
  const keys = ["pigs", "hutches", "rows", "pig_removals"]

  keys.forEach((key) => {
    const existing = localStorage.getItem(`pig_farm_${key}`)
    if (!existing) {
      localStorage.setItem(`pig_farm_${key}`, JSON.stringify([]))
    }
  })
}
