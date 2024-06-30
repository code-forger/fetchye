/* This file contains all the options type helpers
 * The complexity in the options type is that they come from 3 sources
 * 1. Fetchye itself bring options (like `initialData`)
 * 2. The fetchClient brings options (like `methog` in case of the DefaultFetchClient)
 * 3. The fetcher can bring its own options (although the default fetcher does not)
 *
 * therefore, we must combine these sources for the top level options input.
 *
 * However, the options also go though a number of transformations in this code such as
 * 1. Extracting options so they dont affect the cache key
 * 2. checking if certain fileds are functions, then calling them to get the value
 * 3. And most complexly, being passed through the caller supplised `mapOptionsToKey` function
 *
 * Therefore, we must also provide a type for the options after these transformations
 *
 * This is exclusively type juggling, so its been put in here to keep the main code clean
 */

import {
  AdditionalOptionsFromFetcher,
  GenericFetchClient,
  GenericFetcher, KeyFromFetchClient,
  OptionsFromFetchClient,
} from 'fetchye-core';

/**
 * After mapOptionsToKey has been called, the options will be in this shape. Its much more
 * generic, since the caller can do anything they want in mapOptionsToKey. But if they do provide
 * or maintain a headers field, it must be Record<string, string>
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- 'any' here is to say
 * 'This type can be constructed where the options passed to the internal
 *  mapOptionsToKey function are of any type' this is to stop the infinite recursion that would
 *  otherwise occur
 */
export type PostMapOptions<TKey = any, TAllOptions = any> = {
  headers?: Record<string, string>;
  mapKeyToCacheKey?: (key: TKey, options: TAllOptions) => TKey;
  [key: string]: unknown;
}

/**
 * The options that fetchye itself needs
 *
 * TFullOptions is the full final set of options, that will be recursively passed to the
 *   input parameter of mapOptionsToKey, to firmly type the `mapOptionsToKey` that the caller
 *   provides
 */
export type ResolvedFetchyeNativeOptions<TKey, TAllOptions = undefined> = {
  mapOptionsToKey?: (options: TAllOptions) => PostMapOptions<TKey, TAllOptions>;
  mapKeyToCacheKey?: (key: TKey, options: ResolvedFetchyeNativeOptions<TKey>) => TKey;
  defer?: boolean;
  initialData?: { data: unknown; error: unknown; loading: boolean };
}

/**
 * The actual top level native options that fetcyhe requires
 *
 * TFullOptions is needed by ResolvedFetchyeNativeOptions,
 *   see docstring for ResolvedFetchyeNativeOptions
 */
export type FetchyeNativeOptions<TKey, TAllOptions> = {
  headers?: Record<string, unknown> | (() => Record<string, unknown>); // todo propagate type
} & ResolvedFetchyeNativeOptions<TKey, TAllOptions>

/**
 * a tiny util type to clean up AllOptions
 *
 */
export type MergedOptions<
  TFetchClient extends GenericFetchClient<TFetchClient>,
  TFetcher extends GenericFetcher<TFetchClient, TFetcher>
> = OptionsFromFetchClient<TFetchClient> & AdditionalOptionsFromFetcher<TFetcher>

/* eslint-disable @typescript-eslint/no-explicit-any -- in the types AllOptions and
 * ResolvedAllOptions the 'any' in place of the deeply nested type:
 * 'The **options** that are passed to the `mapOptionsToKey` function inside the
 *   current **options**'
 *
 * Since **options** appear twice in the type, it is a recursive type, where `mapOptionsToKey`
 * contains `options` which contains `mapOptionsToKey` which contains `options` and so on.
 *
 * Since this is not deeply support in TS, we need to cut the recursion short by using `any`
 *
 * This allows `options` of different `recursive depths` to agree with each-other.
 *
 * Since it is never expected that a `mapOptionsToKey` calls `mapOptionsToKey`, this is not a
 * problem.
 *
 * If someone were to write such a thing, the 'inner call' to `mapOptionsToKey` would contain an
 * un-typed `mapOptionsToKey` in its options.
 */

/**
 * The actual top level options that fetchye will be passed, including
 *   fetchClient options and fetcher options
 */
export type AllOptions<
  TFetchClient extends GenericFetchClient<TFetchClient>,
  TFetcher extends GenericFetcher<TFetchClient, TFetcher>
> = FetchyeNativeOptions<KeyFromFetchClient<TFetchClient>, ResolvedFetchyeNativeOptions<
    KeyFromFetchClient<TFetchClient>, any
  > & MergedOptions<TFetchClient, TFetcher>>
  & MergedOptions<TFetchClient, TFetcher>

/**
 * The top level options that fetchye will be passed, after resolving the dynamic headers
 *
 */
export type ResolvedAllOptions<
  TFetchClient extends GenericFetchClient<TFetchClient>,
  TFetcher extends GenericFetcher<TFetchClient, TFetcher>
> = ResolvedFetchyeNativeOptions<KeyFromFetchClient<TFetchClient>, ResolvedFetchyeNativeOptions<
    KeyFromFetchClient<TFetchClient>, any
  > & MergedOptions<TFetchClient, TFetcher>>
  & MergedOptions<TFetchClient, TFetcher>

/* eslint-enable @typescript-eslint/no-explicit-any -- reenavle eslint explicit any */
