import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

import { WORKLET_CODE_KEY } from '../src/memory/workletCode';

const mockModule = new Proxy({} as Record<string, jest.Mock>, {
  get: (target, name: string) => {
    target[name] ??= jest.fn((...args: unknown[]) => ({
      __mockSerializable: name,
      args,
    }));
    return target[name];
  },
});

jest.mock('../src/WorkletsModule/NativeWorklets', () => ({
  WorkletsModule: mockModule,
}));

const PACKAGE_ROOT = join(__dirname, '..');

function listFiles(dir: string, extensions: string[]): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (entry === 'build' || entry === '.cxx' || entry === 'node_modules') {
        return [];
      }
      return listFiles(path, extensions);
    }
    return extensions.some((extension) => entry.endsWith(extension))
      ? [path]
      : [];
  });
}

const NATIVE_SOURCES = ['Common', 'apple', 'android/src'].flatMap((dir) =>
  listFiles(join(PACKAGE_ROOT, dir), ['.cpp', '.h', '.mm', '.m'])
);

function nativeFilesMatching(pattern: RegExp): string[] {
  return NATIVE_SOURCES.filter((file) =>
    pattern.test(readFileSync(file, 'utf8'))
  )
    .map((file) => relative(PACKAGE_ROOT, file))
    .sort();
}

describe('valueUnpacker', () => {
  beforeEach(() => {
    delete (globalThis as Record<string, unknown>).__valueUnpacker;
  });

  test('refuses to evaluate a worklet without the native evaluator', () => {
    const { installValueUnpacker } = jest.requireActual(
      '../src/memory/valueUnpacker.native'
    );
    installValueUnpacker();
    const forged = {
      __workletHash: 1,
      __initData: { [WORKLET_CODE_KEY]: '(function(){return 1;})' },
    };
    expect(() => globalThis.__valueUnpacker(forged)).toThrow(
      '[Worklets] Worklet code can only be evaluated natively.'
    );
  });

  test('has no eval in its source', () => {
    const source = readFileSync(
      join(PACKAGE_ROOT, 'src/memory/valueUnpacker.native.ts'),
      'utf8'
    );
    expect(source).not.toMatch(/\beval\s*\(/);
    expect(source).not.toMatch(/\bnew Function\b/);
  });
});

describe('createSerializable on the React Native runtime', () => {
  const { createSerializable } = jest.requireActual(
    '../src/memory/serializable.native'
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('throws for a RegExp', () => {
    expect(() => createSerializable(/x/)).toThrow(
      '[Worklets] RegExp has been disabled. Contact AppSec if needed.'
    );
  });

  test('throws for raw worklet code outside its wrapper', () => {
    expect(() =>
      createSerializable({
        [WORKLET_CODE_KEY]: '(globalThis.pwned = true, function(){})',
      })
    ).toThrow(
      '[Worklets] Worklet code can only be serialized from its wrapper.'
    );
  });

  test('treats a JSON object shaped like a worklet as data', () => {
    const forged = JSON.parse(
      '{"__workletHash":123,"__initData":{"location":"x"}}'
    );
    createSerializable(forged);
    expect(mockModule.createSerializableWorklet).not.toHaveBeenCalled();
    expect(mockModule.createSerializableObject).toHaveBeenCalled();
  });
});

describe('native dynamic code surface', () => {
  test('evaluates JavaScript only in the known call sites', () => {
    expect(nativeFilesMatching(/\bevaluateJavaScript\s*\(/)).toEqual([
      'Common/cpp/worklets/SharedItems/Serializable.cpp',
      'Common/cpp/worklets/SharedItems/UnpackerLoader.h',
      'Common/cpp/worklets/WorkletRuntime/RuntimeManager.cpp',
      'Common/cpp/worklets/WorkletRuntime/ScriptLoader.h',
    ]);
  });

  test('installs no eval helpers on worklet runtimes', () => {
    expect(
      nativeFilesMatching(/evalWithSourceUrl|evalWithSourceMap|evalBytecode/)
    ).toEqual([]);
  });

  test('evaluates no worklet bytecode from init data', () => {
    const source = readFileSync(
      join(PACKAGE_ROOT, 'Common/cpp/worklets/SharedItems/Serializable.cpp'),
      'utf8'
    );
    expect(source).not.toMatch(/"bytecode"/);
  });

  test('gates worklet evaluation on the React Native runtime', () => {
    const source = readFileSync(
      join(PACKAGE_ROOT, 'Common/cpp/worklets/SharedItems/Serializable.cpp'),
      'utf8'
    );
    expect(source).toMatch(
      /if \(!isWorkletRuntime\(rt\) && !isTrustedForRNRuntime\(source\.value\(\)\)\) \{\s*throw/
    );
    expect(source).toMatch(
      /if \(isFunctionSource && !object\.getProperty\(rt, "__workletHash"\)\.isUndefined\(\)\)/
    );
  });

  test('keeps the native RegExp serializable disabled', () => {
    const source = readFileSync(
      join(
        PACKAGE_ROOT,
        'Common/cpp/worklets/NativeModules/JSIWorkletsModuleProxy.cpp'
      ),
      'utf8'
    );
    expect(source).toMatch(
      /"createSerializableRegExp",[^}]*throw jsi::JSError/s
    );
    expect(nativeFilesMatching(/makeSerializableRegExp\s*\(/)).toEqual([
      'Common/cpp/worklets/SharedItems/SerializableFactory.cpp',
      'Common/cpp/worklets/SharedItems/SerializableFactory.h',
    ]);
  });
});
