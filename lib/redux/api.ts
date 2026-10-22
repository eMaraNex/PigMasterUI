import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { EarningsRecord, Pen, Pig, Row } from "@/types";
import { apiUrl } from "@/lib/utils";
import { clearSession } from "./session/sessionSlice";

type ApiEnvelope<T> = { data: T; success: boolean; message?: string };
export type Farm = {
  id: string;
  name: string;
  location?: string | null;
  size?: number | null;
  description?: string | null;
  timezone?: string;
  [key: string]: unknown;
};

export type PigListResult = {
  data: Pig[];
  pagination?: { totalItems?: number; page?: number; limit?: number };
  statistics?: {
    totalPigs: number;
    maleCount: number;
    femaleCount: number;
    pregnantCount: number;
    breederBoarCount: number;
    breedDistribution: Record<string, { males: number; females: number; total: number }>;
  };
};

export type SubscriptionData = {
  current_plan?: string;
  plan_name?: string;
  plan?: string;
  tier?: string;
  status?: string;
  payment_status?: string;
  expiry_date?: string | null;
  subscription_end?: string | null;
};

const baseQuery = fetchBaseQuery({
  baseUrl: apiUrl,
  credentials: "include",
});

export const api = createApi({
  reducerPath: "api",
  baseQuery: async (args, apiContext, extraOptions) => {
    const result = await baseQuery(args, apiContext, extraOptions);
    if (result.error?.status === 401) apiContext.dispatch(clearSession());
    return result;
  },
  tagTypes: ["Farm", "Pig", "Rows", "Pens", "Earnings", "Subscription", "CurrentUser"],
  endpoints: builder => ({
    getCurrentUser: builder.query<Record<string, unknown>, void>({
      query: () => "/auth/me",
      transformResponse: (response: ApiEnvelope<Record<string, unknown>>) => response.data,
      providesTags: ["CurrentUser"],
    }),
    getFarms: builder.query<Farm[], void>({
      query: () => "/farms",
      transformResponse: (response: ApiEnvelope<Farm[]>) => response.data,
      providesTags: ["Farm"],
    }),
    getFarm: builder.query<Farm, string>({
      query: farmId => `/farms/${encodeURIComponent(farmId)}`,
      transformResponse: (response: ApiEnvelope<Farm>) => response.data,
      providesTags: (_result, _error, farmId) => [{ type: "Farm", id: farmId }],
    }),
    getPigs: builder.query<Pig[], string>({
      query: farmId => `/pigs/${encodeURIComponent(farmId)}`,
      transformResponse: (response: ApiEnvelope<Pig[]>) => response.data,
      providesTags: (_result, _error, farmId) => [{ type: "Pig", id: farmId }],
    }),
    getRows: builder.query<Row[], string>({
      query: farmId => `/rows/list/${encodeURIComponent(farmId)}`,
      transformResponse: (response: ApiEnvelope<Row[]>) => response.data,
      providesTags: (_result, _error, farmId) => [{ type: "Rows", id: farmId }],
    }),
    getPens: builder.query<Pen[], string>({
      query: farmId => `/pens/${encodeURIComponent(farmId)}`,
      transformResponse: (response: ApiEnvelope<Pen[]>) => response.data,
      providesTags: (_result, _error, farmId) => [{ type: "Pens", id: farmId }],
    }),
    getFarmAlerts: builder.query<unknown[], string>({
      query: farmId => `/alerts/${encodeURIComponent(farmId)}`,
      transformResponse: (response: ApiEnvelope<unknown[]>) => response.data,
      providesTags: (_result, _error, farmId) => [{ type: "Farm", id: `${farmId}-alerts` }],
    }),
    getFarmCalendar: builder.query<unknown[], string>({
      query: farmId => `/alerts/calendar/${encodeURIComponent(farmId)}`,
      transformResponse: (response: ApiEnvelope<unknown[]>) => response.data,
      providesTags: (_result, _error, farmId) => [{ type: "Farm", id: `${farmId}-calendar` }],
    }),
    getSubscription: builder.query<SubscriptionData, void>({
      query: () => "/subscriptions/me",
      transformResponse: (response: ApiEnvelope<Record<string, unknown>>) => response.data,
      providesTags: ["Subscription"],
    }),
    createFarm: builder.mutation<Farm, Partial<Farm>>({
      query: body => ({ url: "/farms", method: "POST", body }),
      transformResponse: (response: ApiEnvelope<Farm>) => response.data,
      invalidatesTags: ["Farm"],
    }),
    updateFarm: builder.mutation<Farm, { farmId: string; body: Partial<Farm> }>({
      query: ({ farmId, body }) => ({
        url: `/farms/${encodeURIComponent(farmId)}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<Farm>) => response.data,
      invalidatesTags: (_result, _error, { farmId }) => [
        "Farm",
        { type: "Farm", id: farmId },
        "CurrentUser",
      ],
    }),
    getPigDetails: builder.query<PigListResult, {
      farmId: string;
      page: number;
      limit: number;
      sortField: string;
      sortOrder: "asc" | "desc";
      searchTerm?: string;
      filters: object;
    }>({
      query: ({ farmId, ...body }) => ({
        url: `/pigs/${encodeURIComponent(farmId)}/details`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<PigListResult>) => response.data,
      providesTags: (_result, _error, { farmId }) => [{ type: "Pig", id: farmId }],
    }),
    createPig: builder.mutation<Pig, { farmId: string; body: Partial<Pig> }>({
      query: ({ farmId, body }) => ({
        url: `/pigs/${encodeURIComponent(farmId)}`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<Pig>) => response.data,
      invalidatesTags: (_result, _error, { farmId }) => [{ type: "Pig", id: farmId }],
    }),
    updatePig: builder.mutation<Pig, { farmId: string; pigId: string; body: Partial<Pig> }>({
      query: ({ farmId, pigId, body }) => ({
        url: `/pigs/${encodeURIComponent(farmId)}/${encodeURIComponent(pigId)}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<Pig>) => response.data,
      invalidatesTags: (_result, _error, { farmId }) => [{ type: "Pig", id: farmId }],
    }),
    getEarnings: builder.query<EarningsRecord[], {
      farmId: string;
      date_from?: string;
      date_to?: string;
    }>({
      query: ({ farmId, ...params }) => ({
        url: `/earnings/${encodeURIComponent(farmId)}`,
        params,
      }),
      transformResponse: (response: ApiEnvelope<EarningsRecord[]>) => response.data,
      providesTags: (_result, _error, { farmId }) => [{ type: "Earnings", id: farmId }],
    }),
  }),
});

export const {
  useGetCurrentUserQuery,
  useGetFarmsQuery,
  useGetFarmQuery,
  useGetPigsQuery,
  useGetRowsQuery,
  useGetPensQuery,
  useGetFarmAlertsQuery,
  useGetFarmCalendarQuery,
  useGetSubscriptionQuery,
  useCreateFarmMutation,
  useUpdateFarmMutation,
  useGetPigDetailsQuery,
  useCreatePigMutation,
  useUpdatePigMutation,
  useGetEarningsQuery,
} = api;
