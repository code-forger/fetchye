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

import computeHash from 'object-hash';
import {
  GenericFetchClient, GenericFetcher,
  KeyFromFetchClient,
} from 'fetchye-core';
import mapHeaderNamesToLowerCase from './mapHeaderNamesToLowerCase';
import { defaultMapOptionsToKey } from './defaultMapOptionsToKey';
import { handleDynamicHeaders } from './handleDynamicHeaders';
import {
  AllOptions,
  PostMapOptions,
} from './OptionsTypeHelpers';

export type ComputedKey<TFetchClient extends GenericFetchClient<TFetchClient>> = boolean
  | {key:KeyFromFetchClient<TFetchClient>, hash: string}

export type CallableKey<
  TFetchClient extends GenericFetchClient<TFetchClient>,
  TFetcher extends GenericFetcher<TFetchClient, TFetcher>
> = ((options: AllOptions<TFetchClient, TFetcher>) => KeyFromFetchClient<TFetchClient>)
  | KeyFromFetchClient<TFetchClient>;

export const computeKey = <
  TFetchClient extends GenericFetchClient<TFetchClient>,
  TFetcher extends GenericFetcher<TFetchClient, TFetcher>
>(
    key: CallableKey<TFetchClient, TFetcher>,
    allOptions: AllOptions<TFetchClient, TFetcher>): ComputedKey<TFetchClient> => {
  const {
    mapOptionsToKey = (options) => options as PostMapOptions,
  } = allOptions;

  const {
    headers,
    mapKeyToCacheKey,
    ...restOfOptions
  } = defaultMapOptionsToKey(
    mapOptionsToKey(
      handleDynamicHeaders<TFetchClient, TFetcher>(allOptions))
  );

  const nextOptions: PostMapOptions = { ...restOfOptions };
  if (headers) {
    nextOptions.headers = mapHeaderNamesToLowerCase(headers);
  }

  let nextKey: KeyFromFetchClient<TFetchClient>;
  if (typeof key === 'function') {
    try {
      // @ts-expect-error -- We have just type checked this to ensure it is a function
      nextKey = key(nextOptions);
    } catch (error) {
      return false;
    }
    if (!nextKey) {
      return false;
    }
  } else {
    nextKey = key;
  }

  let cacheKey = nextKey;
  if (mapKeyToCacheKey !== undefined && typeof mapKeyToCacheKey === 'function') {
    try {
      cacheKey = mapKeyToCacheKey(nextKey, nextOptions);
    } catch (error) {
      return false;
    }
    if (!cacheKey) {
      return false;
    }
  } else if (mapKeyToCacheKey !== undefined) {
    throw new TypeError('mapKeyToCacheKey must be a function');
  }

  return { key: nextKey, hash: computeHash([cacheKey, nextOptions], { respectType: false }) };
};

export default computeKey;
