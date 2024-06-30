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
  loadingAction,
  setAction,
  errorAction,
  type FetchyeDispatch,
  type GenericFetchClient, GenericFetcher,
} from 'fetchye-core';
import { handleDynamicHeaders } from './handleDynamicHeaders';
import { ComputedKey } from './computeKey';
import { AllOptions } from './OptionsTypeHelpers';

export const runAsync = async <
  TFetchClient extends GenericFetchClient<TFetchClient>,
  TFetcher extends GenericFetcher<TFetchClient, TFetcher>
>({
  dispatch, computedKey, fetcher, fetchClient, options,
}: {
  dispatch: FetchyeDispatch,
  computedKey: ComputedKey<TFetchClient>,
  fetcher: TFetcher,
  fetchClient: TFetchClient,
  options: AllOptions<TFetchClient, TFetcher>,
}): Promise<{data: unknown, error: Error | unknown} | undefined> => {
  if (typeof computedKey === 'boolean') {
    return undefined;
  }
  dispatch(loadingAction({ hash: computedKey.hash }));
  const {
    payload: data,
    error: requestError,
  } = await fetcher(
    fetchClient,
    computedKey.key,
    handleDynamicHeaders(options)
  );
  if (!requestError) {
    dispatch(setAction({ hash: computedKey.hash, value: data }));
  } else {
    dispatch(errorAction({ hash: computedKey.hash, error: requestError }));
  }
  return { data, error: requestError };
};

export default runAsync;
