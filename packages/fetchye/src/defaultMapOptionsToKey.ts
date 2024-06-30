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

// additional fields we want to prevent from getting in the cache key
import { PostMapOptions } from './OptionsTypeHelpers';

/**
 * Althought this is a bit of a cheat, this type simply additionally specifies all fields
 * that should be extracted in defaultMapOptionsToKey.
 *
 * In theory, it would be neccisary to ensure the layer above (which is the caller passed mapOptionsToKey)
 * return an object with all these key. But since the entire point of this function is to extract
 * and immediately discard these fields, it is not neccisary to enforce this.
 */
export type ExtractableOptions = PostMapOptions & {
  signal?: unknown
  defer?: unknown
  mapOptionsToKey?: unknown
  initialData?: unknown
};

export const defaultMapOptionsToKey = (options: ExtractableOptions): PostMapOptions => {
  const {
    /* eslint-disable @typescript-eslint/no-unused-vars -- extracted to exclude from rest */
    signal,
    defer,
    mapOptionsToKey,
    initialData,
    /* eslint-enable @typescript-eslint/no-unused-vars -- extracted to exclude from rest */
    ...restOfOptions
  } = options;
  return restOfOptions;
};

export default defaultMapOptionsToKey;
