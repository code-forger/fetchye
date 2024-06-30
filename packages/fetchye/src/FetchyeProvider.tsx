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

import React, {
  useMemo, useReducer, useEffect, useRef,
} from 'react';
import PropTypes from 'prop-types';
import {
  defaultEqualityChecker,
  useSubscription,
  defaultFetcher,
  FetchyeContext,
  FetchyeCache,
  GenericFetchClient,
  EqualityChecker,
  FetchyeContextType,
  GenericFetcher, Subscribe, GetCacheByKey,

} from 'fetchye-core';
import SimpleCache from './SimpleCache';
import useRefReducer, { ReducerRefState } from './useRefReducer';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- See 'External Caches are untyped' in the TSNOTES.md file
type UntypedCacheShape = any;

const makeUseFetchyeSelector = ({
  fetchyeState, subscribe, getCacheByKey, equalityChecker,
}: {
  fetchyeState: ReducerRefState,
  subscribe: Subscribe,
  getCacheByKey: GetCacheByKey<UntypedCacheShape>,
  equalityChecker: EqualityChecker,
}) => (key: string | undefined) => {
  const [, forceRender] = useReducer((n) => n + 1, 0);
  const initialValue = getCacheByKey(fetchyeState.current, key);
  const lastSelectorValue = useRef(initialValue);
  const selectorValue = useRef(initialValue);

  useEffect(() => {
    function checkForUpdates() {
      const nextValue = getCacheByKey(fetchyeState.current, key);
      lastSelectorValue.current = selectorValue.current;
      selectorValue.current = nextValue;
      if (equalityChecker(selectorValue.current, lastSelectorValue.current)) {
        return;
      }
      forceRender();
    }

    checkForUpdates();
    return subscribe(checkForUpdates);
  }, [key]);

  return selectorValue;
};

type FetchyeProviderProps<
  TFetchClient extends GenericFetchClient<TFetchClient>,
  TFetcher extends GenericFetcher<TFetchClient, TFetcher>
> = {
  cache: FetchyeCache,
  fetcher: TFetcher,
  equalityChecker: EqualityChecker,
  fetchClient: TFetchClient,
  initialData: Record<string, unknown>,
  children: React.ReactNode,
}

const FetchyeProvider = <
  TFetchClient extends GenericFetchClient<TFetchClient>,
  TFetcher extends GenericFetcher<TFetchClient, TFetcher>
>({
    cache = SimpleCache(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see message in `useFetchyeContext` about why this 'as any as' is needed while applying defaults
    fetcher = defaultFetcher as any as TFetcher,
    equalityChecker = defaultEqualityChecker,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see message in `useFetchyeContext` about why this 'as any as' is needed while applying defaults
    fetchClient = fetch as any as TFetchClient,
    initialData = cache.reducer(undefined, { type: '' }),
    children,
  }: FetchyeProviderProps<TFetchClient, TFetcher>) => {
  const [notify, subscribe] = useSubscription();
  const [fetchyeState, dispatch] = useRefReducer(cache.reducer, initialData, notify);

  const memoizedConfig: FetchyeContextType<TFetchClient, TFetcher> = useMemo(() => ({
    dispatch,
    cache,
    defaultFetcher: fetcher,
    useFetchyeSelector: makeUseFetchyeSelector({
      fetchyeState,
      subscribe,
      getCacheByKey: cache.getCacheByKey,
      equalityChecker,
    }),
    fetchClient,
  }), [cache, equalityChecker, fetchClient, fetcher, subscribe, fetchyeState, dispatch]);

  return (
    <FetchyeContext.Provider value={memoizedConfig}>
      {children}
    </FetchyeContext.Provider>
  );
};

FetchyeProvider.propTypes = {
  cache: PropTypes.shape({
    reducer: PropTypes.func,
    getCacheByKey: PropTypes.func,
  }),
  initialData: PropTypes.shape({}),
  equalityChecker: PropTypes.func,
  fetchClient: PropTypes.func,
  fetcher: PropTypes.func,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};

export default FetchyeProvider;
