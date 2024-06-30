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

import createSharedReactContext from 'create-shared-react-context';
import type { Dispatch as ReduxDispatch, Reducer } from 'redux';
import type { Dispatch as ReactDispatch } from 'react';
import {
  GenericFetchClient,
  GenericFetcher,
} from './defaultFetcher';
import { FetchyeAction } from './actions';

// Touching this will cause a breaking change
export const SHARED_CONTEXT_ID = 'FetchyeContext';

export type FetchyeSelectedValues = {
  data: unknown;
  loading: boolean;
  error: Error | undefined;
};

export type UseFetchyeSelector = (hash: string | undefined) => { current: FetchyeSelectedValues };

export type Nullable<T> = T | null;

export type GetCacheByKey<TCacheShape> = (
  cache: TCacheShape, key: string | undefined
) => FetchyeSelectedValues;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- reducer can have any shape as long as the cacheSelector and reducer in the cache agree
export type FetchyeCache<TCacheShape = any, TReducerShape = any> = {
  getCacheByKey: GetCacheByKey<TCacheShape>,
  reducer: Reducer<TReducerShape, FetchyeAction>,
  cacheSelector: (state: TReducerShape) => TCacheShape,
}

// interoperability between react and redux type
export type FetchyeDispatch = ReduxDispatch<FetchyeAction> | ReactDispatch<FetchyeAction>;

export type FetchyeContextType<
  TFetchClient extends GenericFetchClient<TFetchClient>,
  TFetcher extends GenericFetcher<TFetchClient, TFetcher>
> = {
  cache?: FetchyeCache;
  defaultFetcher?: TFetcher;
  useFetchyeSelector?: UseFetchyeSelector;
  dispatch?: FetchyeDispatch,
  fetchClient?: TFetchClient
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- It is impossible to pass to this location TFetchClient and TFetcher so any, any is the best we can do
export const FetchyeContext = createSharedReactContext<Nullable<FetchyeContextType<any, any>>>(
  null,
  SHARED_CONTEXT_ID
);
