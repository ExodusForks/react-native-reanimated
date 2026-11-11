'use strict';

import type { ValueUnpacker, WorkletFunction } from '../types';

export function installValueUnpacker() {
  'worklet';
  'no-worklet-closure';
  const workletsCache = new Map<number, () => unknown>();
  const handleCache = new WeakMap<object, unknown>();

  function valueUnpacker(
    objectToUnpack: ObjectToUnpack,
    _category?: string,
    _remoteFunctionName?: string,
    evaluateWorkletFunction?: () => () => unknown
  ): unknown {
    const workletHash = objectToUnpack.__workletHash;
    if (workletHash !== undefined) {
      let workletFun = workletsCache.get(workletHash);
      if (workletFun === undefined) {
        if (evaluateWorkletFunction === undefined) {
          throw new Error(
            '[Worklets] Worklet code can only be evaluated natively.'
          );
        }
        workletFun = evaluateWorkletFunction();
        workletsCache.set(workletHash, workletFun);
      }
      const functionInstance = workletFun.bind(objectToUnpack);
      objectToUnpack._recur = functionInstance;
      return functionInstance;
    } else if (objectToUnpack.__init !== undefined) {
      let value = handleCache.get(objectToUnpack);
      if (value === undefined) {
        value = objectToUnpack.__init();
        handleCache.set(objectToUnpack, value);
      }
      return value;
    } else {
      throw new Error(
        `[Worklets] Data type not recognized by value unpacker: "${globalThis._toString(
          objectToUnpack
        )}".`
      );
    }
  }

  globalThis.__valueUnpacker = valueUnpacker as ValueUnpacker;
}

interface ObjectToUnpack extends WorkletFunction {
  _recur: unknown;
}
