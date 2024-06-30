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

import {
  IS_LOADING,
  SET_DATA,
  DELETE_DATA,
  ERROR,
  CLEAR_ERROR,
  ACTION_NAMESPACE,
  type FetchyeAction,
  type FetchyeCache,
  type FetchyeSelectedValues,
} from 'fetchye-core';
import invariant from 'invariant';
import type { Reducer } from 'redux';

export type SimpleCacheState = {
  errors: Record<string, Error | unknown>,
  loading: Record<string, string>,
  data: Record<string, unknown>,
}

/* eslint-disable @typescript-eslint/no-unused-vars -- throughout this file variables of form
* `deleted<VariableName>` are used to explicitly indicate to the user which element
* is being descructured from our state for disposal. These variables are named for humans, then
* explcitly never used to discard them. */

// eslint-disable-next-line default-param-last -- the first default param value takes care of explicitly calling this function with `undefined` the second param can't be defaulted as it must be provided
const reducer: Reducer<SimpleCacheState, FetchyeAction> = (state = {
  errors: {},
  loading: {},
  data: {},
}, action) => {
  if (!action.type.startsWith(ACTION_NAMESPACE)) {
    return state;
  }
  switch (action.type) {
    case DELETE_DATA: {
      const { [action.hash]: deletedEntry, ...nextData } = state.data;
      return {
        ...state,
        data: {
          ...nextData,
        },
      };
    }
    case CLEAR_ERROR: {
      const { [action.hash]: deletedEntry, ...nextErrors } = state.errors;
      return {
        ...state,
        errors: {
          ...nextErrors,
        },
      };
    }
    case ERROR: {
      const { [action.hash]: deletedLoadingEntry, ...nextLoading } = state.loading;
      const { [action.hash]: deletedDataEntry, ...nextData } = state.data;
      return {
        ...state,
        data: {
          ...nextData,
        },
        errors: {
          ...state.errors,
          [action.hash]: action.error,
        },
        loading: {
          ...nextLoading,
        },
      };
    }
    case IS_LOADING: {
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.hash]: action.hash,
        },
      };
    }
    case SET_DATA: {
      const { [action.hash]: deletedLoadingEntry, ...nextLoading } = state.loading;
      const { [action.hash]: deletedErrorEntry, ...nextErrors } = state.errors;
      return {
        ...state,
        data: {
          ...state.data,
          [action.hash]: action.value,
        },
        errors: {
          ...nextErrors,
        },
        loading: {
          ...nextLoading,
        },
      };
    }
    default:
      return state;
  }
};

/* eslint-enable @typescript-eslint/no-unused-vars -- enable for disable */

export type SimpleCacheShape = {
  errors?: Record<string, Error>, // todo cross check, is an error an Error, or a string?
  loading?: Record<string, string>,
  data?: Record<string, unknown>,
}

type GetCacheByKey = (cache: SimpleCacheShape, key: string | undefined) => FetchyeSelectedValues;

const getCacheByKey: GetCacheByKey = (cache = {}, key = undefined) => {
  invariant(key, 'key must be provided to getCacheByKey');
  const data = cache.data?.[key as string];
  const loading = !!cache.loading?.[key as string];
  const error = cache.errors?.[key as string];
  return { data, loading, error };
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- Since the cache is a socket
* we have no way of knowing at this point what the cache will look like
* But its actually only important to use that the selector returns a FetchyeCacheShape */
export type CacheSelector = (state: any) => SimpleCacheShape;

export type SimpleCache = {
  getCacheByKey: GetCacheByKey,
  reducer: Reducer<SimpleCacheState, FetchyeAction>,
  cacheSelector: CacheSelector,
}

const defaultCacheSelector: CacheSelector = (state: SimpleCacheShape) => state;

const SimpleCache = (
  { cacheSelector = defaultCacheSelector }: {cacheSelector?: CacheSelector} = {}
): FetchyeCache<SimpleCacheShape, SimpleCacheState> => ({
  getCacheByKey,
  reducer,
  cacheSelector,
});
export default SimpleCache;
