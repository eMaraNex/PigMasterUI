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
      query: () => "/farms/list?limit=100",
      transformResponse: (response: ApiEnvelope<Farm[]>) => response.data,
      providesTags: ["Farm"],
    }),
    getFarm: builder.query<Farm, string>({
      query: farmId => `/farms/list/${encodeURIComponent(farmId)}`,
      transformResponse: (response: ApiEnvelope<Farm>) => response.data,
      providesTags: (_result, _error, farmId) => [{ type: "Farm", id: farmId }],
    }),
    getPigs: builder.query<Pig[], string>({
      query: () => "/pigs/list?limit=2000",
      transformResponse: (response: ApiEnvelope<Pig[]>) => response.data,
      providesTags: (_result, _error, farmId) => [{ type: "Pig", id: farmId }],
    }),
    getRows: builder.query<Row[], string>({
      query: () => "/rows/list?limit=500",
      transformResponse: (response: ApiEnvelope<Row[]>) => response.data,
      providesTags: (_result, _error, farmId) => [{ type: "Rows", id: farmId }],
    }),
    getPens: builder.query<Pen[], string>({
      query: () => "/pens/list?limit=5000&include=pigs",
      transformResponse: (response: ApiEnvelope<Pen[]>) => response.data,
      providesTags: (_result, _error, farmId) => [{ type: "Pens", id: farmId }],
    }),
    getFarmAlerts: builder.query<unknown[], string>({
      query: () => "/alerts/today",
      transformResponse: (response: ApiEnvelope<unknown[]>) => response.data,
      providesTags: (_result, _error, farmId) => [{ type: "Farm", id: `${farmId}-alerts` }],
    }),
    getFarmCalendar: builder.query<unknown[], string>({
      query: () => "/alerts/list?limit=1000",
      transformResponse: (response: ApiEnvelope<unknown[]>) => response.data,
      providesTags: (_result, _error, farmId) => [{ type: "Farm", id: `${farmId}-calendar` }],
    }),
    getSubscription: builder.query<SubscriptionData, void>({
      query: () => "/subscriptions/me",
      transformResponse: (response: ApiEnvelope<Record<string, unknown>>) => response.data,
      providesTags: ["Subscription"],
    }),
    createFarm: builder.mutation<Farm, Partial<Farm>>({
      query: body => ({ url: "/farms/create", method: "POST", body }),
      transformResponse: (response: ApiEnvelope<Farm>) => response.data,
      invalidatesTags: ["Farm"],
    }),
    updateFarm: builder.mutation<Farm, { farmId: string; body: Partial<Farm> }>({
      query: ({ farmId, body }) => ({
        url: `/farms/update/${encodeURIComponent(farmId)}`,
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
      filters: { gender?: string[]; breed?: string[]; isPregnant?: boolean; ageRange?: string };
    }>({
      // Generic list (search, sort, filters, paging) plus whole-farm statistics.
      async queryFn({ page, limit, sortField, sortOrder, searchTerm, filters }, _api, _extra, fetchWithBQ) {
        const filter: { field: string; operator: string; value: unknown }[] = [];
        if (filters.gender?.length) filter.push({ field: "gender", operator: "in", value: filters.gender });
        if (filters.breed?.length) filter.push({ field: "breed", operator: "in", value: filters.breed });
        if (filters.isPregnant !== undefined) filter.push({ field: "is_pregnant", operator: "eq", value: filters.isPregnant });
        const monthsAgo = (months: number) => {
          const date = new Date();
          date.setMonth(date.getMonth() - months);
          return date.toISOString().slice(0, 10);
        };
        if (filters.ageRange === "young") filter.push({ field: "birth_date", operator: "gt", value: monthsAgo(6) });
        if (filters.ageRange === "adult") {
          filter.push({ field: "birth_date", operator: "lte", value: monthsAgo(6) });
          filter.push({ field: "birth_date", operator: "gt", value: monthsAgo(24) });
        }
        if (filters.ageRange === "senior") filter.push({ field: "birth_date", operator: "lte", value: monthsAgo(24) });
        const [list, stats] = await Promise.all([
          fetchWithBQ({
            url: "/pigs/list",
            method: "POST",
            body: {
              page, limit, search: searchTerm, filter,
              sort: [{ field: sortField || "created_at", order: sortOrder === "asc" ? "ASC" : "DESC" }],
              include: "pen_history,birth_history,health_records,feeding_schedule",
            },
          }),
          fetchWithBQ("/pigs/statistics"),
        ]);
        if (list.error) return { error: list.error };
        if (stats.error) return { error: stats.error };
        const body = list.data as { data: Pig[]; total: number; page: number; limit: number };
        return {
          data: {
            data: body.data,
            pagination: { totalItems: body.total, page: body.page, limit: body.limit },
            statistics: (stats.data as ApiEnvelope<PigListResult["statistics"]>).data,
          },
        };
      },
      providesTags: (_result, _error, { farmId }) => [{ type: "Pig", id: farmId }],
    }),
    createPig: builder.mutation<Pig, { farmId: string; body: Partial<Pig> }>({
      query: ({ farmId, body }) => ({
        url: "/pigs/create",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<Pig>) => response.data,
      invalidatesTags: (_result, _error, { farmId }) => [{ type: "Pig", id: farmId }],
    }),
    updatePig: builder.mutation<Pig, { farmId: string; pigId: string; body: Partial<Pig> }>({
      query: ({ farmId, pigId, body }) => ({
        url: `/pigs/update/${encodeURIComponent(pigId)}`,
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
        url: "/earnings/list",
        params: {
          limit: 1000,
          ...(params.date_from || params.date_to
            ? { "dateRange[field]": "date", "dateRange[from]": params.date_from, "dateRange[to]": params.date_to }
            : {}),
        },
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
