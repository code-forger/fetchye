/*
 * Copyright 2023 American Express Travel Related Services Company, Inc.
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

import { GenericFetchClient, GenericFetcher } from 'fetchye-core';
import {
} from './computeKey';
import { AllOptions, ResolvedAllOptions } from './OptionsTypeHelpers';

// todo crosscheck, return should not be FetchyeExtendedOptions in other contextx
export const handleDynamicHeaders = <
  TFetchClient extends GenericFetchClient<TFetchClient>,
  TFetcher extends GenericFetcher<TFetchClient, TFetcher>
>(
    options: AllOptions<TFetchClient, TFetcher>
  ): ResolvedAllOptions<TFetchClient, TFetcher> => {
  if (typeof options.headers === 'function') {
    return {
      ...options,
      headers: options.headers(),
    };
  }
  return options;
};
