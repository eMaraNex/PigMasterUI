import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface Kit {
  id?: string
  kit_number: string
  birth_weight: string
  gender: string
  color: string
  status: string
  notes: string
  breeding_record_id?: string
  parent_male_id?: string
  parent_female_id?: string
  actual_birth_date?: string
}

interface KitsState {
  kits: Kit[]
  isLoading: boolean
  error: string | null
  nextKitNumber: number
}

const initialState: KitsState = {
  kits: [],
  isLoading: false,
  error: null,
  nextKitNumber: 1,
}

const kitsSlice = createSlice({
  name: "kits",
  initialState,
  reducers: {
    // Add a new kit to the list
    addKit: (state) => {
      const newKit: Kit = {
        kit_number: `RB-${state.nextKitNumber.toString().padStart(3, "0")}`,
        birth_weight: "",
        gender: "",
        color: "",
        status: "alive",
        notes: "",
      }
      state.kits.push(newKit)
      state.nextKitNumber += 1
    },

    // Remove a kit by index
    removeKit: (state, action: PayloadAction<number>) => {
      state.kits.splice(action.payload, 1)
    },

    // Update a specific kit field
    updateKit: (state, action: PayloadAction<{ index: number; field: keyof Kit; value: string }>) => {
      const { index, field, value } = action.payload
      if (state.kits[index]) {
        state.kits[index][field] = value
      }
    },

    // Clear all kits (useful after successful submission)
    clearKits: (state) => {
      state.kits = []
      state.nextKitNumber = 1
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    // Set error state
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    // Set next kit number (useful when fetching existing data)
    setNextKitNumber: (state, action: PayloadAction<number>) => {
      state.nextKitNumber = action.payload
    },

    // Initialize kits with existing data
    initializeKits: (state, action: PayloadAction<Kit[]>) => {
      state.kits = action.payload
    },
  },
})

export const { addKit, removeKit, updateKit, clearKits, setLoading, setError, setNextKitNumber, initializeKits } =
  kitsSlice.actions

export default kitsSlice.reducer
