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

import { type MutableRefObject, useRef } from 'react';
import { FetchyeAction, FetchyeDispatch, Notify } from 'fetchye-core';
import type { Reducer } from 'redux';

export type ReducerRefState = MutableRefObject<Record<string, unknown>>;

const useRefReducer = (
  reducer: Reducer<Record<string, unknown>,
    FetchyeAction>, initialState: Record<string, unknown>,
  notify: Notify
): [ReducerRefState, FetchyeDispatch] => {
  const state = useRef(initialState);

  const dispatch: FetchyeDispatch = (action: FetchyeAction) => {
    state.current = reducer(state.current, action);
    notify();
  };
  return [state, dispatch];
};

export default useRefReducer;
