/*
 * Copyright 2020 American Express Travel Related Services Company, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

// Object.fromEntries is not compatible with Node v10
// provide our own lightweight solution

export const headersToObject = (
  headers: Iterable<[string, string]> = []
): Record<string, string> => [...headers]
  .reduce((acc: Record<string, string>, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});

// /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- this FetchClient is the
// * atom of the socket code in fetchye. Anyone can bering a fetch client, that takes any key
// * or options, therefore it must be <any, any> in most context */
export type FetchClient<TKey, TOptions> = (key: TKey, options: TOptions) => Promise<{
  text: () => Promise<string>;
  ok: boolean;
  headers: Iterable<[string, string]>;
  status: number;
}>

export type DefaultFetchClient = FetchClient<RequestInfo | URL, RequestInit>;

export type OptionsFromFetchClient<TFetchClient> = (
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- need to extract TOptions
  TFetchClient extends FetchClient<infer TKeyUnused, infer TOptions> ? TOptions: never
)
export type KeyFromFetchClient<TFetchClient> = (
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- need to infer both because there is no default
  TFetchClient extends FetchClient<infer TKey, infer TOptionsUnused> ? TKey : never
);

// A util type for constructing a fetch client with concrete key and options
export type GenericFetchClient<TFetchClient> = FetchClient<
  KeyFromFetchClient<TFetchClient>, OptionsFromFetchClient<TFetchClient>
>;

// The core of the fetchye type system is that the `key` and `options` parameters are derived
// from the `fetchClient`. In most cases `fetchClient` will be `defaultFetchClient` aka `fetch`
// But if the consumer wishes to bring their own, we need to pass its type all the way down.
export type Fetcher<
  TFetchClient extends GenericFetchClient<TFetchClient>,
  TFetcherAdditionalOptions
> = (
  fetchClient: TFetchClient,
  key: KeyFromFetchClient<TFetchClient>,
  options: OptionsFromFetchClient<TFetchClient> & TFetcherAdditionalOptions
) => Promise<({
  payload?: {
    body: unknown;
    ok: boolean;
    headers: Record<string, string>;
    status: number;
  };
  error: unknown | Error;
})>;

export type AdditionalOptionsFromFetcher<TFetcher> = (
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- need to infer both because there is no default
  TFetcher extends Fetcher<infer TFetchClientUnused, infer TFetcherAdditionalOptions>
    ? TFetcherAdditionalOptions
    : never
  );

export type DefaultFetcher = Fetcher<DefaultFetchClient, Record<string, never>>
export type GenericDefaultFetcher<
  TFetchClient extends GenericFetchClient<TFetchClient>,
  TFetcher extends Fetcher<TFetchClient, AdditionalOptionsFromFetcher<TFetcher>>,
> = Fetcher<TFetchClient, AdditionalOptionsFromFetcher<TFetcher>>

// A util type for constructing a fetch client with concrete key and options
export type GenericFetcher<
  TFetchClient extends GenericFetchClient<TFetchClient>,
  TFetcher
> = Fetcher<GenericFetchClient<TFetchClient>, AdditionalOptionsFromFetcher<TFetcher>>;

export const defaultFetcher: DefaultFetcher = async (fetchClient, key, options) => {
  let res;
  let payload;
  let error;
  try {
    res = await fetchClient(key, options);
    let body = await res.text();
    try {
      body = JSON.parse(body);
    } catch (e) {
      // body will still be the text from the response, so no action needed here
    }
    payload = {
      body,
      ok: res.ok,
      headers: headersToObject(res.headers),
      status: res.status,
    };
  } catch (requestError) {
    // eslint-disable-next-line no-console -- error useful to developer in specific error case
    console.error(requestError);
    error = requestError;
  }
  return {
    payload,
    error,
  };
};

export default defaultFetcher;
