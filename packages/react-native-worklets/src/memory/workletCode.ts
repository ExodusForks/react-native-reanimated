'use strict';

import type { WorkletInitData } from '../types';

export const WORKLET_CODE_WRAPPER_KEY = '__reanimated_workletCodeWrapper';
export const WORKLET_CODE_KEY = '__reanimated_workletCode';

function isWorkletCodeWrapper(
  wrapper: unknown
): wrapper is Record<symbol, string> {
  if (typeof wrapper !== 'object' || wrapper === null) {
    return false;
  }
  if (Object.getOwnPropertyNames(wrapper).length !== 0) {
    return false;
  }
  const symbols = Object.getOwnPropertySymbols(wrapper);
  return (
    symbols.length === 1 &&
    symbols[0] === Symbol.for(WORKLET_CODE_KEY) &&
    typeof (wrapper as Record<symbol, unknown>)[symbols[0]] === 'string'
  );
}

/**
 * Reads the worklet code that the Exodus Babel plugin stores under
 * `Symbol.for('__reanimated_workletCode')`. Throws on any other shape so a
 * forged wrapper can't smuggle extra properties into the Worklet Runtime.
 */
export function unwrapWorkletCode(wrapper: unknown): string {
  if (!isWorkletCodeWrapper(wrapper)) {
    throw new Error('[Worklets] Invalid worklet code wrapper.');
  }
  return wrapper[Symbol.for(WORKLET_CODE_KEY)];
}

export function getInitDataCode(
  initData: WorkletInitData | undefined
): string | undefined {
  const wrapper = initData?.[WORKLET_CODE_WRAPPER_KEY];
  if (wrapper === undefined) {
    return undefined;
  }
  return unwrapWorkletCode(wrapper);
}
