'use strict';

import type { ValueUnpacker, WorkletFunction } from '../types';

function __installUnpacker() {
  const workletsCache = new Map<number, () => unknown>();
  const handleCache = new WeakMap<object, unknown>();

  function valueUnpacker(
    objectToUnpack: ObjectToUnpack,
    category?: string,
    remoteFunctionName?: string,
    evaluateWorkletFunction?: () => (() => unknown)
  ): unknown {
    // eslint-disable-next-line strict
    'use strict';
    const workletHash = objectToUnpack.__workletHash;
    if (workletHash !== undefined) {
      let workletFun = workletsCache.get(workletHash);
      if (workletFun === undefined) {
        workletFun = evaluateWorkletFunction?.() as (() => unknown) | undefined;
        workletsCache.set(workletHash, workletFun!);
      }
      const functionInstance = workletFun!.bind(objectToUnpack);
      objectToUnpack._recur = functionInstance;
      return functionInstance;
    } else if (objectToUnpack.__init !== undefined) {
      let value = handleCache.get(objectToUnpack);
      if (value === undefined) {
        value = objectToUnpack.__init();
        handleCache.set(objectToUnpack, value);
      }
      return value;
    } else if (category === 'RemoteFunction') {
      const fun = () => {
        const label = remoteFunctionName
          ? `function \`${remoteFunctionName}\``
          : 'anonymous function';
        // eslint-disable-next-line reanimated/use-worklets-error
        throw new Error(`[Worklets] Tried to synchronously call a non-worklet ${label} on the UI thread.
See https://docs.swmansion.com/react-native-worklets/docs/guides/troubleshooting#tried-to-synchronously-call-a-non-worklet-function-on-the-ui-thread for more details.`);
      };
      fun.__remoteFunction = objectToUnpack;
      return fun;
    } else {
      // eslint-disable-next-line reanimated/use-worklets-error
      throw new Error(
        `[Worklets] Data type in category "${category}" not recognized by value unpacker: "${globalThis._toString(
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
