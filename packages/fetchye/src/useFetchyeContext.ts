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

import { useContext, useReducer } from 'react';
import {
  defaultFetcher as libraryFetcher,
  FetchyeContext,
  type FetchyeContextType,
  type UseFetchyeSelector,
  type Nullable,
  FetchyeCache,
  FetchyeDispatch,
  GenericFetchClient, GenericFetcher,
} from 'fetchye-core';
import SimpleCache from './SimpleCache';

export const useFetchyeContext = <
  TFetchClient extends GenericFetchClient<TFetchClient>,
  TFetcher extends GenericFetcher<TFetchClient, TFetcher>
>():{
  cache: FetchyeCache,
  defaultFetcher: TFetcher,
  useFetchyeSelector: UseFetchyeSelector,
  dispatch: FetchyeDispatch,
  fetchClient: TFetchClient,
  headless: boolean,
} => {
  const fallbackCache: FetchyeCache = SimpleCache();
  // Setup headless mode fallbacks
  const [state, fallbackDispatch] = useReducer(fallbackCache.reducer, fallbackCache.reducer(undefined, { type: '' }));

  const fallbackUseFetchyeSelector: UseFetchyeSelector = (hash) => ({
    current: fallbackCache.getCacheByKey(state, hash),
  });

  const providedContext = useContext<
    Nullable<FetchyeContextType<TFetchClient, TFetcher>>
  >(FetchyeContext);
  const {
    cache = fallbackCache,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see message below about why these 2 'any's are needed
    defaultFetcher = libraryFetcher as any as TFetcher,
    useFetchyeSelector = fallbackUseFetchyeSelector,
    dispatch = fallbackDispatch,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- Here fetch is a concrete type
    * However this whole system can be passed a Generic: TFetchClient.
    * Type script is saying 'You cannot assign this concrete implementation here,
    * because you have provided no proof it will match the generic passed into the system
    * by the caller.'. However, the only reason a caller _would_
    * pass in a generic, instead of allowing DefaultFetchClient to be used for TFetchClient, is when
    * They have provided their own fetchClient. In this case, 'providedContext' will contain a fetch
    * client. This _does_ mean that it is the callers responsibility to ensure they pass the type
    * of their fetchClient to useFetchye, and this responsibility is well documented. */
    fetchClient = fetch as any as TFetchClient,
  }: FetchyeContextType<TFetchClient, TFetcher> = providedContext || {};

  return {
    cache,
    defaultFetcher,
    useFetchyeSelector,
    dispatch,
    fetchClient,
    headless: true,
  };
};

export default useFetchyeContext;
