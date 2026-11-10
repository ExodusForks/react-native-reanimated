'use strict';
import { version } from '../../package.json';
/**
 * We hardcode the version of Reanimated here in order to compare it with the
 * version used to build the native part of the library in runtime. Remember to
 * keep this in sync with the version declared in `package.json`
 */
export const jsVersion = version;
