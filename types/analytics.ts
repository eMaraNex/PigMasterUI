export interface BreedCount {
    breed: string;
    count: number;
    percentage: number;
}

export interface GenderData {
    gender: string;
    count: number;
    percentage: number;
}

export interface HealthData {
    name: string;
    value: number;
    color: string;
}

export interface AgeGroup {
    age: string;
    count: number;
}

export interface FeedData {
    month: string;
    consumption: number;
    cost: number;
}

export interface MonthlyEarning {
    month: string;
    amount: number;
}

export interface WeightTrend {
    breed: string;
    weight: number;
    count: number;
}

export interface MortalityData {
    month: string;
    rate: number;
}

export interface OccupancyData {
    name: string;
    value: number;
    color: string;
}