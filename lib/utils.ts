import axios from "axios";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Pig, Alert, Pen } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate sequential pig IDs based on farm name
export function generatePigId(farmId: string): string {
  const tempFarm = localStorage.getItem("pig_farm_data") ?? "";
  const farmDetails = tempFarm ? JSON.parse(tempFarm) : {};
  const farmData = farmDetails.id === farmId ? farmDetails : null;
  const farmName = farmData?.name ?? "Default";
  const words = farmName.trim().split(/\s+/);
  let prefix = "";
  if (words.length >= 2) {
    prefix = `${words[0][0]}${words[1][0]}`.toUpperCase();
  } else {
    prefix = words[0][0].toUpperCase();
  }
  const cachedPigs = localStorage.getItem(`pig_farm_pigs_${farmId}`);
  let existingIds: number[] = [];
  if (cachedPigs) {
    try {
      const pigs = JSON.parse(cachedPigs) as Pig[];
      existingIds = pigs
        .filter((pig: Pig) => pig.pig_id && pig.pig_id.startsWith(`${prefix}-`))
        .map((pig: Pig) => {
          const idNum = pig.pig_id
            ? Number.parseInt(pig.pig_id.replace(`${prefix}-`, ""))
            : 0;
          return idNum;
        })
        .filter((id: number) => !isNaN(id));
    } catch (error) {
      console.error(`Error parsing pigs for farm ${farmName}:`, error);
    }
  }

  const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
  let nextId = maxId + 1;
  while (existingIds.includes(nextId)) {
    nextId++;
  }
  return `${prefix}-${nextId.toString().padStart(3, "0")}`;
}

// Generate pig names for large scale operations
export function generatePigName(id: string): string {
  // For large operations, use ID as name
  return id;
}

// Calculate age in months
export function calculateAge(birth_date: string): number {
  const birth = new Date(birth_date);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  return months;
}

// Format date for display
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

// Check if pig is ready for breeding
export function isBreedingReady(pig: any): boolean {
  const ageInMonths = calculateAge(pig.birth_date);
  if (pig.gender === "female") {
    return ageInMonths >= 6 && !pig.is_pregnant;
  } else {
    return ageInMonths >= 6;
  }
}
const normalizeUrl = (url: any) => url.replace(/\/$/, "");

export const baseUrl =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_API_URL
    : "http://localhost:5000";
export const apiUrl = `${normalizeUrl(baseUrl)}/api/v1`;

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const parseTrialPeriod = () => {
  const parsed = Number.parseInt(
    process.env.NEXT_PUBLIC_TRIAL_PERIOD ?? process.env.TRIAL_PERIOD ?? "30",
    10
  );
  return Number.isNaN(parsed) ? 30 : Math.max(parsed, 1);
};

export interface TrialInfo {
  isTrialActive: boolean;
  trialEndsAt: string | null;
  trialDaysLeft: number;
}

export const TRIAL_PERIOD_DAYS = parseTrialPeriod();

const defaultTrialInfo: TrialInfo = {
  isTrialActive: false,
  trialEndsAt: null,
  trialDaysLeft: 0,
};

export const getFarmTrialInfo = (): TrialInfo => {
  if (typeof window === "undefined") {
    return defaultTrialInfo;
  }

  try {
    // First, check farm creation date
    const farmDataRaw = localStorage.getItem("pig_farm_data");
    let createdAt: string | null = null;

    if (farmDataRaw) {
      try {
        const farmData = JSON.parse(farmDataRaw);
        createdAt = farmData?.created_at ?? farmData?.createdAt ?? null;
      } catch (error) {
        console.error("Failed to parse farm data:", error);
      }
    }

    // If no farm data, check user creation date
    if (!createdAt) {
      const userDataRaw = localStorage.getItem("pig_farm_user");
      if (userDataRaw) {
        try {
          const userData = JSON.parse(userDataRaw);
          createdAt = userData?.created_at ?? null;
        } catch (error) {
          console.error("Failed to parse user data:", error);
        }
      }
    }
    if (!createdAt) {
      return defaultTrialInfo;
    }
    const createdDate = new Date(createdAt);
    if (Number.isNaN(createdDate.getTime())) {
      return defaultTrialInfo;
    }
    const trialEndDate = new Date(
      createdDate.getTime() + TRIAL_PERIOD_DAYS * DAY_IN_MS
    );
    const now = new Date();
    const isTrialActive = now.getTime() <= trialEndDate.getTime();
    const trialDaysLeft = isTrialActive
      ? Math.max(
          0,
          Math.ceil((trialEndDate.getTime() - now.getTime()) / DAY_IN_MS)
        )
      : 0;

    return {
      isTrialActive,
      trialEndsAt: trialEndDate.toISOString(),
      trialDaysLeft,
    };
  } catch (error) {
    console.error("Failed to parse farm trial info:", error);
    return defaultTrialInfo;
  }
};

export function formatPigCount(sows: number, boars: number): string {
  const sowText = sows === 1 ? "1 sow" : sows > 1 ? `${sows} sows` : "";
  const boarText = boars === 1 ? "1 boar" : boars > 1 ? `${boars} boars` : "";

  if (sowText && boarText) {
    return `${sowText}, ${boarText}`;
  }
  return sowText || boarText;
}

export const getCurrentLocation = (): Promise<{
  latitude: number;
  longitude: number;
}> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      error => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("Permission to access location was denied."));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Location information is unavailable."));
            break;
          case error.TIMEOUT:
            reject(new Error("The request to get location timed out."));
            break;
          default:
            reject(
              new Error("An unknown error occurred while fetching location.")
            );
            break;
        }
      }
    );
  });
};

export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
    );
    const suburb =
      response.data.address.suburb ||
      response.data.address.city ||
      response.data.address.town;
    const state = response.data.address.state || response.data.address.region;
    const country =
      response.data.address.country || response.data.address.country_code;
    return `${suburb} - ${state}, ${country}` || "Address not found";
  } catch (error) {
    throw new Error("Failed to fetch address from coordinates.");
  }
};

// Breeding and age-related constants
export const MIN_BREEDING_AGE_MONTHS = 4; // Minimum age for breeding in months
export const PREGNANCY_DURATION_DAYS = 114; // Pig pregnancy duration: 3 months, 3 weeks, 3 days
export const NESTING_BOX_START_DAYS = 110; // When to add nesting box (days after mating, ~4 days before expected birth)
export const NESTING_BOX_END_DAYS = 112; // End of nesting box addition period (~2 days before expected birth)
export const WEANING_PERIOD_DAYS = 42; // Weaning period after birth
export const POST_WEANING_BREEDING_DELAY_DAYS = 7; // Days after weaning before sow can breed again
export const BIRTH_EXPECTED_WINDOW_DAYS = { before: 7, after: 2 }; // Birth expected alert window (7 days before, 2 days after)
export const FOSTERING_DAYS_AFTER_BIRTH = 20;

// Calculate age in months
export const calculateAgeInMonths = (birthDate: string | undefined): number => {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const now = new Date();
  const diff = now.getTime() - birth.getTime();
  return diff / (1000 * 60 * 60 * 24 * 30.42); // Approximate months
};

// Check if pig is mature for breeding
export const isPigMature = (pig: {
  birth_date?: string;
}): { isMature: boolean; reason: string } => {
  if (!pig.birth_date) {
    return { isMature: false, reason: "Birth date not available" };
  }
  const ageInMonths = calculateAgeInMonths(pig.birth_date);
  return ageInMonths >= MIN_BREEDING_AGE_MONTHS
    ? { isMature: true, reason: "Pig is mature" }
    : {
        isMature: false,
        reason: `Pig is too young (${Math.round(ageInMonths)} months)`,
      };
};

export const generateAlerts = (
  pigs: Pig[],
  setAlerts: (alerts: Alert[]) => void,
  setOverduePigs: (pigs: Pig[]) => void,
  notifiedPigsRef: React.MutableRefObject<Set<string>>
): void => {
  const currentDate = new Date();
  const alertsList: Alert[] = [];
  const overduePigsList: Pig[] = [];

  pigs.forEach(pig => {
    // Skip immature female pigs for pregnancy-related alerts
    const maturity = isPigMature(pig);
    if (!maturity.isMature && pig.gender === "female") {
      return;
    }

    // --- Pregnancy Noticed Alert ---
    // Notifies when a sow is confirmed pregnant (from pregnancy_start_date to day 25)
    if (pig.is_pregnant && pig.pregnancy_start_date) {
      let pregnancyStart;
      try {
        pregnancyStart = new Date(pig.pregnancy_start_date);
        if (isNaN(pregnancyStart.getTime())) {
          console.error(
            `Invalid pregnancy_start_date for ${pig.name}:`,
            pig.pregnancy_start_date
          );
          pregnancyStart = currentDate;
        }
      } catch (e) {
        console.error(`Error parsing pregnancy_start_date for ${pig.name}:`, e);
        pregnancyStart = currentDate;
      }
      const timeDiff = currentDate.getTime() - pregnancyStart.getTime();
      const daysSincePregnancy = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

      if (
        daysSincePregnancy >= 0 &&
        daysSincePregnancy < (NESTING_BOX_START_DAYS || 110)
      ) {
        alertsList.push({
          type: "Pregnancy Noticed",
          message: `${pig.name} (${
            pig.pen_id || "N/A"
          }) - Confirmed pregnant since ${pregnancyStart.toLocaleDateString()}`,
          variant: "secondary",
        });
      }

      // --- Nesting Box Needed Alert ---
      // Reminds to add a nesting box when pregnancy reaches days 110-112
      if (
        daysSincePregnancy >= (NESTING_BOX_START_DAYS || 110) &&
        daysSincePregnancy < (NESTING_BOX_END_DAYS || 112)
      ) {
        alertsList.push({
          type: "Nesting Box Needed",
          message: `${pig.name} (${
            pig.pen_id || "N/A"
          }) - Add nesting box, ${daysSincePregnancy} days since mating`,
          variant: "secondary",
        });
      }

      // --- Birth Expected Alert ---
      // Alerts when birth is expected (days 110-114) or overdue
      if (pig.expected_birth_date && !pig.actual_birth_date) {
        let expectedDate;
        try {
          expectedDate = new Date(pig.expected_birth_date);
          if (isNaN(expectedDate.getTime()))
            throw new Error("Invalid expected_birth_date");
        } catch (e) {
          console.error(
            `Invalid expected_birth_date for ${pig.name}:`,
            pig.expected_birth_date
          );
          expectedDate = new Date(
            currentDate.getTime() +
              (PREGNANCY_DURATION_DAYS || 114) * 24 * 60 * 60 * 1000
          );
        }
        const daysToBirth = Math.ceil(
          (expectedDate.getTime() - currentDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (daysSincePregnancy >= 110 && daysSincePregnancy <= 114) {
          alertsList.push({
            type: "Birth Expected",
            message: `${pig.name} (${
              pig.pen_id || "N/A"
            }) - Expected to give birth ${
              daysToBirth === 0
                ? "today"
                : daysToBirth > 0
                ? `in ${daysToBirth} days`
                : `overdue by ${Math.abs(daysToBirth)} days`
            }`,
            variant: daysToBirth <= 0 ? "destructive" : "secondary",
          });
        }

        // --- Overdue Birth Toast Notification ---
        // Shows a toast when expected birth date is exceeded (overdue)
        if (daysToBirth < 0 && !notifiedPigsRef.current.has(pig.pig_id ?? "")) {
          overduePigsList.push(pig);
        }
      }
    }

    // --- Fostering Needed Alert ---
    // Suggests fostering piglets 20 days after birth
    if (pig.actual_birth_date) {
      let birthDate;
      try {
        birthDate = new Date(pig.actual_birth_date);
        if (isNaN(birthDate.getTime()))
          throw new Error("Invalid actual_birth_date");
      } catch (e) {
        console.error(
          `Invalid actual_birth_date for ${pig.name}:`,
          pig.actual_birth_date
        );
        birthDate = currentDate;
      }
      const timeDiff = currentDate.getTime() - birthDate.getTime();
      const daysSinceBirth = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

      if (daysSinceBirth === (FOSTERING_DAYS_AFTER_BIRTH || 20)) {
        alertsList.push({
          type: "Fostering Needed",
          message: `${pig.name} (${
            pig.pen_id || "N/A"
          }) - Consider fostering piglets to other sows`,
          variant: "secondary",
        });
      }

      // --- Weaning and Nesting Box Removal Alert ---
      // Reminds to wean piglets and remove nesting box 42 days after birth
      if (daysSinceBirth === (WEANING_PERIOD_DAYS || 42)) {
        alertsList.push({
          type: "Weaning and Nesting Box Removal",
          message: `${pig.name} (${
            pig.pen_id || "N/A"
          }) - Wean piglets and move to new pens, remove nesting box`,
          variant: "secondary",
        });
      }
    }

    // --- Breeding Ready Alert ---
    // Notifies when a mature sow is ready for the next breeding cycle
    if (pig.gender === "female" && !pig.is_pregnant && maturity.isMature) {
      const lastBirth = pig.actual_birth_date
        ? new Date(pig.actual_birth_date)
        : null;
      const weaningDate = lastBirth
        ? new Date(
            lastBirth.getTime() +
              (WEANING_PERIOD_DAYS || 42) * 24 * 60 * 60 * 1000
          )
        : null;
      const oneWeekAfterWeaning = weaningDate
        ? new Date(
            weaningDate.getTime() +
              (POST_WEANING_BREEDING_DELAY_DAYS || 7) * 24 * 60 * 60 * 1000
          )
        : null;
      if (
        (!pig.pregnancy_start_date ||
          (pig.pregnancy_start_date &&
            currentDate.getTime() >
              new Date(pig.pregnancy_start_date).getTime() +
                ((PREGNANCY_DURATION_DAYS || 114) +
                  (WEANING_PERIOD_DAYS || 42)) *
                  24 *
                  60 *
                  60 *
                  1000)) &&
        (!oneWeekAfterWeaning || currentDate > oneWeekAfterWeaning)
      ) {
        alertsList.push({
          type: "Breeding Ready",
          message: `${pig.name} (${
            pig.pen_id || "N/A"
          }) - Ready for next breeding cycle`,
          variant: "outline",
        });
      }
    }

    // --- Medication Due Alert ---
    // Notifies when a pig's vaccination is overdue
    // if (pig.next_due) {
    //   const nextDueDate = new Date(pig.next_due);
    //   const daysDiff = Math.ceil((nextDueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    //   if (daysDiff <= 0) {
    //     alertsList.push({
    //       type: "Medication Due",
    //       message: `${pig.name} (${pig.pen_id}) - Vaccination overdue by ${Math.abs(daysDiff)} days`,
    //       variant: "destructive",
    //     });
    //   }
    // }
  });

  // Sort alerts by urgency (overdue > upcoming > ready)
  alertsList.sort((a, b) => {
    const order = { destructive: 0, secondary: 1, outline: 2 } as const;
    return order[a.variant] - order[b.variant];
  });
  setAlerts([...alertsList.slice(0, 15)]); // Force re-render
  setOverduePigs(overduePigsList);
};

export const getPigDynamicFarmName = () => {
  try {
    const farmDetails = localStorage.getItem("pig_farm_data");
    const farm = farmDetails ? JSON.parse(farmDetails) : null;
    return farm && farm.name ? farm.name : "Pig Farm";
  } catch (error) {
    console.error("Error parsing pig_farm_data:", error);
    return "Pig Farm";
  }
};

export function penNamesConversion(pens: Pen[], message: string): string {
  const penIdPattern =
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
  const match = message.match(penIdPattern);

  if (match) {
    const penId = match[0];

    const matchingPen = pens.find(pen => pen.id === penId);

    if (matchingPen) {
      return message.replace(penId, matchingPen.name);
    }
  }

  return message;
}

export const ANNUAL_DISCOUNT = 0.16;

export function calculateAnnualPrice(monthlyPrice: number): number {
  return monthlyPrice * 12 * (1 - ANNUAL_DISCOUNT);
}

export function calculateMonthlyFromAnnual(annualPrice: number): number {
  return annualPrice / (12 * (1 - ANNUAL_DISCOUNT));
}

export function getSavePercent(): number {
  return Math.round(ANNUAL_DISCOUNT * 100);
}
