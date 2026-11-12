import { flattenArray } from '../src/createAnimatedComponent/utils';

describe('flattenArray', () => {
  it('wraps a non-array value', () => {
    expect(flattenArray('a')).toEqual(['a']);
  });

  it('preserves order of a flat array', () => {
    expect(flattenArray(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
  });

  it('preserves order across nested arrays', () => {
    expect(flattenArray(['a', ['b', ['c', 'd']], 'e', [], ['f']])).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
    ]);
  });

  it('keeps later style entries after earlier ones', () => {
    const base = { opacity: 0, height: 10 };
    const override = { height: 20 };
    const [first, second] = flattenArray([base, override]);
    expect(first).toBe(base);
    expect(second).toBe(override);
  });

  it('does not overflow the stack on deeply nested input', () => {
    let nested: unknown = 'leaf';
    for (let i = 0; i < 100_000; i++) {
      nested = [nested];
    }
    expect(flattenArray(nested as never)).toEqual(['leaf']);
  });
});
