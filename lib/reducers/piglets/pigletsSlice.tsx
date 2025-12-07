import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface Piglet {
  id?: string
  piglet_number: string
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

interface PigletsState {
  piglets: Piglet[]
  isLoading: boolean
  error: string | null
  nextPigletNumber: number
}

const initialState: PigletsState = {
  piglets: [],
  isLoading: false,
  error: null,
  nextPigletNumber: 1,
}

const pigletsSlice = createSlice({
  name: "piglets",
  initialState,
  reducers: {
    // Add a new piglet to the list
    addPiglet: (state) => {
      const newPiglet: Piglet = {
        piglet_number: `RB-${state.nextPigletNumber.toString().padStart(3, "0")}`,
        birth_weight: "",
        gender: "",
        color: "",
        status: "alive",
        notes: "",
      }
      state.piglets.push(newPiglet)
      state.nextPigletNumber += 1
    },

    // Remove a piglet by index
    removePiglet: (state, action: PayloadAction<number>) => {
      state.piglets.splice(action.payload, 1)
    },

    // Update a specific piglet field
    updatePiglet: (state, action: PayloadAction<{ index: number; field: keyof Piglet; value: string }>) => {
      const { index, field, value } = action.payload
      if (state.piglets[index]) {
        state.piglets[index][field] = value
      }
    },

    // Clear all piglets (useful after successful submission)
    clearPiglets: (state) => {
      state.piglets = []
      state.nextPigletNumber = 1
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    // Set error state
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    // Set next piglet number (useful when fetching existing data)
    setNextPigletNumber: (state, action: PayloadAction<number>) => {
      state.nextPigletNumber = action.payload
    },

    // Initialize piglets with existing data
    initializePiglets: (state, action: PayloadAction<Piglet[]>) => {
      state.piglets = action.payload
    },
  },
})

export const { addPiglet, removePiglet, updatePiglet, clearPiglets, setLoading, setError, setNextPigletNumber, initializePiglets } =
  pigletsSlice.actions

export default pigletsSlice.reducer
