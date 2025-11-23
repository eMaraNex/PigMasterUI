import { FeedingSchedule } from "./feeding";
import { HealthRecord } from "./health";

export interface Pig {
    hutch_name?: string;
    id?: string;
    pig_id?: string;
    farm_id: string;
    name: string;
    gender: "male" | "female";
    breed: string;
    color: string;
    birth_date?: string;
    weight: number;
    hutch_id?: string;
    parent_male_id?: string;
    parent_female_id?: string;
    is_pregnant: boolean;
    last_mating_date?: string;
    mated_with?: string;
    expected_birth_date?: string;
    total_litters?: number;
    total_kits?: number;
    healthRecords?: HealthRecord[];
    feedingSchedule?: FeedingSchedule;
    created_at?: string;
    status?: "active" | "inactive" | "sold" | "removed";
    notes?: string;
    actual_birth_date?: string;
    pregnancy_start_date?: string;
    birth_history?: any[];
    health_records?: any[];
    feeding_schedule?: {
        daily_amount: string | number;
        feed_type: string;
        times: string[];
        last_fed: string;
    };
}

export interface RemovalRecord {
    hutch_name?: string;
    pig_id?: string;
    hutch_id?: string;
    reason: string;
    notes: string;
    date: string;
}


export interface KitFormData {
    kit_number: string;
    birth_weight: string;
    gender: "male" | "female" | "";
    color: string;
    status: "alive" | "dead" | "";
    notes: string;
}

export interface AddKitDialogProps {
    pig: Pig;
    sowId: string;
    boarId?: string;
    sowName?: string;
    boarName?: string;
    onClose: () => void;
    onKitAdded: () => void;
}

export interface AddPigDialogProps {
    hutch_name?: string;
    hutch_id?: string;
    onClose: () => void;
    onPigAdded: (newPig: Pig) => void;
    customHutches?: boolean;
}


export interface EditPigDialogProps {
    pig: Pig;
    onClose: () => void;
    onUpdate: (updatedPig: Pig) => void;
}


export interface PigListProps {
    farmId: string;
}

export interface PigProfileProps {
    pig: Pig;
    onClose: () => void;
}

export interface RemovePigDialogProps {
    hutch_name?: string;
    hutch_id?: string;
    pig: Pig | undefined;
    onClose: () => void;
    onRemovalSuccess?: (pigId: string) => void;
}


export interface PigListSkeletonProps {
    farmId: string;
}
