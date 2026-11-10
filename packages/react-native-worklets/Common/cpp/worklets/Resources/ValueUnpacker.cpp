// This file was generated with
// `packages/react-native-worklets/scripts/export-unpackers.js`.
// Please do not modify it directly.

#include <worklets/Resources/Unpackers.h>

namespace worklets {

const char ValueUnpackerCode[] =
    R"DELIMITER__((function () {
  var workletsCache = new Map();
  var handleCache = new WeakMap();
  function valueUnpacker(objectToUnpack, category, remoteFunctionName, evaluateWorkletFunction) {
    'use strict';

    var workletHash = objectToUnpack.__workletHash;
    if (workletHash !== undefined) {
      var workletFun = workletsCache.get(workletHash);
      if (workletFun === undefined) {
        workletFun = evaluateWorkletFunction === null || evaluateWorkletFunction === void 0 ? void 0 : evaluateWorkletFunction();
        workletsCache.set(workletHash, workletFun);
      }
      var functionInstance = workletFun.bind(objectToUnpack);
      objectToUnpack._recur = functionInstance;
      return functionInstance;
    } else if (objectToUnpack.__init !== undefined) {
      var value = handleCache.get(objectToUnpack);
      if (value === undefined) {
        value = objectToUnpack.__init();
        handleCache.set(objectToUnpack, value);
      }
      return value;
    } else if (category === 'RemoteFunction') {
      var fun = function fun() {
        var label = remoteFunctionName ? "function `".concat(remoteFunctionName, "`") : 'anonymous function';
        throw new Error("[Worklets] Tried to synchronously call a non-worklet ".concat(label, " on the UI thread.\nSee https://docs.swmansion.com/react-native-worklets/docs/guides/troubleshooting#tried-to-synchronously-call-a-non-worklet-function-on-the-ui-thread for more details."));
      };
      fun.__remoteFunction = objectToUnpack;
      return fun;
    } else {
      throw new Error("[Worklets] Data type in category \"".concat(category, "\" not recognized by value unpacker: \"").concat(globalThis._toString(objectToUnpack), "\"."));
    }
  }
  globalThis.__valueUnpacker = valueUnpacker;
})();)DELIMITER__";
} // namespace worklets
