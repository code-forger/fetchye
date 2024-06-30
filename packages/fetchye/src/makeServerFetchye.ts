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
  FetchyeCache,
  FetchyeDispatch,
  GenericDefaultFetcher,
  GenericFetchClient,
  GenericFetcher,
  ssrFetcher,
} from 'fetchye-core';
import SimpleCache from './SimpleCache';
import { runAsync } from './runAsync';
import { CallableKey, computeKey } from './computeKey';
import { coerceSsrField } from './queryHelpers';
import { AllOptions } from './OptionsTypeHelpers';

const makeServerFetchye = <TFetchClient extends GenericFetchClient<TFetchClient>>({
  cache = SimpleCache(),
  store: { getState, dispatch },
  fetchClient,
}: {
  cache?: FetchyeCache,
  store: { getState: () => unknown, dispatch: FetchyeDispatch },
  fetchClient: TFetchClient
}) => async <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see the message in `useFetchye` about any is needed while applying defaults
  TFetcher extends GenericFetcher<TFetchClient, TFetcher> = GenericDefaultFetcher<any, any>
>(
    key: CallableKey<TFetchClient, TFetcher>,
    options: AllOptions<TFetchClient, TFetcher> = {} as AllOptions<TFetchClient, TFetcher>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see message in `useFetchyeContext` about why this 'as any as' is needed while applying defaults
    fetcher: TFetcher = ssrFetcher as any as TFetcher
  ) => {
    const { cacheSelector } = cache;
    const computedKey = computeKey(key, options);
    const run = () => runAsync({
      dispatch,
      computedKey: computeKey(key, options),
      fetcher,
      fetchClient,
      options,
    });

    if (!getState || !dispatch || !cacheSelector) {
      const res = await runAsync({
        dispatch: () => {}, computedKey, fetcher, fetchClient, options,
      });
      return {
        data: coerceSsrField(res?.data),
        error: coerceSsrField(res?.error),
        run,
      };
    }
    const state = cacheSelector(getState());
    const { data, loading, error } = cache.getCacheByKey(state, typeof computedKey === 'boolean' ? undefined : computedKey.hash);
    if (!data && !error && !loading) {
      const res = await runAsync({
        dispatch, computedKey, fetcher, fetchClient, options,
      });
      return {
        data: coerceSsrField(res?.data),
        error: coerceSsrField(res?.error),
        run,
      };
    }
    return { data: coerceSsrField(data), error: coerceSsrField(error), run };
  };

export default makeServerFetchye;

// const run = async () => {
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
//
//   const myFetchClient: MyFetchClient = async (key, options) => {
//     console.log(options.foo);
//     console.log(options.bar);
//     return {
//       text: async () => 'hi',
//       ok: true,
//       headers: new Map(),
//       status: 200,
//     };
//   };
//
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
//   const fetcye1 = makeServerFetchye({
//     fetchClient: myFetchClient,
//     store: {
//       getState: () => ({}),
//       dispatch: () => {
//       },
//     },
//   });
//   let r1 = await fetcye1(
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
//   r1 = await fetcye1(
//     false,
//     {
//       foo: '123',
//       bar: false,
//       otherThing: 'hi',
//       mapOptionsToKey: ignoreHeadersByKey(['headers']),
//     },
//     myFetcher
//   );
//   const fetcye2 = makeServerFetchye({
//     fetchClient: fetch as DefaultFetchClient,
//     store: {
//       getState: () => ({}),
//       dispatch: () => {
//       },
//     },
//   });
//   let r2 = await fetcye2(
//     'string',
//     {
//       mapOptionsToKey: (thing) => ({ defer: false, thing: thing.defer }),
//     }
//   );
//   r2 = await fetcye2(
//     'string',
//     {
//       mapOptionsToKey: ignoreHeadersByKey(['headers']),
//     }
//   );
//   const fetcye3 = makeServerFetchye({
//     fetchClient: fetch as DefaultFetchClient,
//     store: {
//       getState: () => ({}),
//       dispatch: () => {
//       },
//     },
//   });
//   const r3 = await fetcye3(
//     'string'
//   );
//
//   return [r1, r2, r3];
// };
