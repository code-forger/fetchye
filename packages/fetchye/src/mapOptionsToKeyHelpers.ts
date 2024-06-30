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

const filterObjectByKeys = (object: Record<string, string>, keys: string[]) => Object.keys(object)
  .filter((key) => !keys.includes(key))
  .reduce((acc: Record<string, unknown>, key) => {
    // mutating accumulator to prevent many, many object allocations
    acc[key] = object[key];
    return acc;
  }, {});

const headersInitToRecord = (headersInit: HeadersInit)
  : Record<string, string> => Object.fromEntries(new Headers(headersInit).entries());

export const ignoreHeadersByKey = (keys: string[]) => (options: {
  headers?: HeadersInit}): {
  [key: string]: unknown,
} => {
  const { headers } = options;
  return (
    headers
      ? {
        ...options,
        headers: filterObjectByKeys(headersInitToRecord(headers), keys),
      }
      : options
  );
};
