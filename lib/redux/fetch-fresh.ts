import type { AppDispatch } from "./store";

type ListEndpoint<A> = {
  initiate: (arg: A, options: { forceRefetch: boolean; subscribe: boolean }) => any;
};

/**
 * Fetches a fresh copy of a list query outside a component subscription.
 * If the same query is already being refetched (for example a dialog just invalidated it),
 * RTK Query resolves with no data. Wait and ask again instead of handing back `undefined`,
 * which crashed screens that read `.length` after edits.
 */
export async function fetchFresh<T, A>(dispatch: AppDispatch, endpoint: ListEndpoint<A>, arg: A): Promise<T[]> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const result = await dispatch(endpoint.initiate(arg, { forceRefetch: true, subscribe: false })).unwrap();
    if (Array.isArray(result)) return result as T[];
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  return [];
}
