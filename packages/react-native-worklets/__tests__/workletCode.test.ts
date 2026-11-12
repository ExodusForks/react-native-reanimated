import {
  getInitDataCode,
  unwrapWorkletCode,
  WORKLET_CODE_WRAPPER_KEY,
} from '../src/memory/workletCode';

const CODE = '(function foo(){return 1;})';

describe('unwrapWorkletCode', () => {
  test('returns the code stored under the worklet code symbol', () => {
    expect(
      unwrapWorkletCode({ [Symbol.for('__reanimated_workletCode')]: CODE })
    ).toBe(CODE);
  });

  test.each([
    ['a non-object', CODE],
    ['null', null],
    ['an empty object', {}],
    ['a plain code property', { code: CODE }],
    [
      'an extra string property',
      { [Symbol.for('__reanimated_workletCode')]: CODE, code: CODE },
    ],
    [
      'an extra symbol property',
      {
        [Symbol.for('__reanimated_workletCode')]: CODE,
        [Symbol.for('other')]: CODE,
      },
    ],
    ['a different symbol', { [Symbol('__reanimated_workletCode')]: CODE }],
    ['non-string code', { [Symbol.for('__reanimated_workletCode')]: 1 }],
  ])('rejects %s', (_name, wrapper) => {
    expect(() => unwrapWorkletCode(wrapper)).toThrow(
      '[Worklets] Invalid worklet code wrapper.'
    );
  });
});

describe('getInitDataCode', () => {
  test('ignores the upstream code property', () => {
    expect(getInitDataCode({ code: CODE })).toBeUndefined();
  });

  test('reads the wrapped code', () => {
    expect(
      getInitDataCode({
        [WORKLET_CODE_WRAPPER_KEY]: {
          [Symbol.for('__reanimated_workletCode')]: CODE,
        },
      })
    ).toBe(CODE);
  });
});
