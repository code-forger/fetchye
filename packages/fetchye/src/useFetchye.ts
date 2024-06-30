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

import { useEffect, useRef } from 'react';
import {
  DefaultFetchClient,
  GenericDefaultFetcher,
  GenericFetchClient,
  GenericFetcher,
} from 'fetchye-core';
import { runAsync } from './runAsync';
import {
  CallableKey,
  computeKey,
} from './computeKey';
import {
  isLoading,
} from './queryHelpers';
import { useFetchyeContext } from './useFetchyeContext';
import { AllOptions } from './OptionsTypeHelpers';

const passInitialData = (
  value: unknown,
  initialValue: unknown,
  numOfRenders: number
) => (numOfRenders === 1
  ? value || initialValue
  : value);
const useFetchye = <
  TFetchClient extends GenericFetchClient<TFetchClient> = DefaultFetchClient,

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- Saying that the DefaultFetcher
   * here is constructed over 'any' fetchClient does not matter, since we already have the real
   * generic fetchClient TFetchClient. We never try to extract anything from the
   * DefaultFetcher's fetch client since we always have TFetchClient to hand.
   *
   * in a perfect work, TS would support partial generic type inference and take TFetcher from
   * the passed fetcher, but it doesn't.
   *
   * Coupled with the fact we _cant_ infer the TFetchClient, becuase it comes from context, the only
   * option is to provide a GenericDefaultFetcher<any> as the default fetcher.
   */
  TFetcher extends GenericFetcher<TFetchClient, TFetcher> = GenericDefaultFetcher<any, any>
>(
    key: CallableKey<TFetchClient, TFetcher>,
    options: AllOptions<TFetchClient, TFetcher>,
    fetcher?: TFetcher
  ) => {
  const {
    defaultFetcher, useFetchyeSelector, dispatch, fetchClient,
  } = useFetchyeContext<TFetchClient, TFetcher>();
  const selectedFetcher = typeof fetcher === 'function' ? fetcher : defaultFetcher;
  const computedKey = computeKey(key, options);
  const selectorState = useFetchyeSelector(typeof computedKey === 'boolean' ? undefined : computedKey.hash);
  // create a render version manager using refs
  const numOfRenders = useRef(0);
  numOfRenders.current += 1;

  useEffect(() => {
    if (options.defer || !computedKey) {
      return;
    }
    // If first render and initialData.data exists from SSR then return early
    if (numOfRenders.current === 1 && options.initialData?.data) {
      return;
    }
    const { loading, data, error } = selectorState.current;
    if (!loading && !data && !error) {
      runAsync({
        dispatch, computedKey, fetcher: selectedFetcher, fetchClient, options,
      });
    }
  });

  return {
    isLoading: isLoading({
      loading: selectorState.current.loading,
      data: selectorState.current.data || options.initialData?.data,
      numOfRenders: numOfRenders.current,
      options,
    }),
    error: passInitialData(
      selectorState.current.error,
      options.initialData?.error,
      numOfRenders.current
    ),
    data: passInitialData(
      selectorState.current.data,
      options.initialData?.data,
      numOfRenders.current
    ),
    run() {
      return runAsync({
        dispatch,
        computedKey: computeKey(key, options),
        fetcher: selectedFetcher,
        fetchClient,
        options,
      });
    },
  };
};

export default useFetchye;
//
// const MyComponent = () => {
//   // TODO remove this when we have a better example
//   type MyFetchClient = (
//     key: boolean,
//     options: { foo: string, bar: boolean, headers?: Record<string, string> }
//   ) =>
//     Promise<{
//       text: () => Promise<string>;
//       ok: boolean;
//       headers: Iterable<[string, string]>
//       status: number;
//     }>;
//   const myFetcher: Fetcher<MyFetchClient, { otherThing: string }> = async (
//     fetchClient,
//     key,
//     options
//   ) => {
//     console.log(options.otherThing);
//     const stuff = await fetchClient(key, options);
//     const body = await stuff.text();
//     return {
//       payload: {
//         body,
//         ok: stuff.ok,
//         headers: {},
//         status: stuff.status,
//       },
//       error: undefined,
//     };
//   };
//
//   useFetchye<MyFetchClient, typeof myFetcher>(
//     false,
//     {
//       foo: '123',
//       bar: false,
//       otherThing: 'hi',
//       mapOptionsToKey: (thing) => ({
//         defer: thing.bar,
//         thing: thing.defer,
//         thing2: thing.otherThing,
//       }),
//     },
//     myFetcher
//   );
//   useFetchye<MyFetchClient, typeof myFetcher>(
//     false,
//     {
//       foo: '123',
//       bar: false,
//       otherThing: 'hi',
//       mapOptionsToKey: ignoreHeadersByKey(['headers']),
//     },
//     myFetcher
//   );
//   // useFetchye(
//   //   'string',
//   //   {
//   //     mapOptionsToKey: (thing) => ({ defer: false, thing: thing.credentials}),
//   //   }
//   // );
//   useFetchye(
//     'string',
//     {
//       mapOptionsToKey: ignoreHeadersByKey(['headers']),
//     }
//   );
//   // useFetchye(
//   //   'string'
//   // );
//   return null;
// };
