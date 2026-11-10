'use strict';
import type { StyleProps } from '../commonTypes';
import type { CSSStyle } from '../css';
import type { NestedArray } from './commonTypes';

// Security: iterative stack-based flatten to prevent stack overflow via
// deeply nested arrays (0073)
export function flattenArray<T>(array: NestedArray<T>): T[] {
  if (!Array.isArray(array)) {
    return [array];
  }
  const result: T[] = [];
  const stack: NestedArray<T>[] = [array];
  while (stack.length > 0) {
    const item = stack.pop();
    if (Array.isArray(item)) {
      for (let i = item.length - 1; i >= 0; i--) {
        stack.push(item[i]);
      }
    } else {
      result.push(item as T);
    }
  }
  return result;
}

// Security: use Object.hasOwn instead of `in` to avoid prototype chain
// lookups (0074)
export const has = <K extends string>(
  key: K,
  x: unknown
): x is { [key in K]: unknown } => {
  if (typeof x === 'function' || typeof x === 'object') {
    if (x === null || x === undefined) {
      return false;
    } else {
      return Object.hasOwn(x as object, key);
    }
  }
  return false;
};

type FilteredStyles = {
  cssStyle: CSSStyle | null;
  animatedStyles: StyleProps[];
};

export function filterStyles(styles: StyleProps[] | undefined): FilteredStyles {
  if (!styles) {
    return { animatedStyles: [], cssStyle: null };
  }

  return styles.reduce<FilteredStyles>(
    ({ animatedStyles, cssStyle }, style) => {
      if (style?.viewDescriptors) {
        animatedStyles.push(style);
      } else {
        cssStyle = { ...cssStyle, ...style } as CSSStyle;
      }
      return { animatedStyles, cssStyle };
    },
    { animatedStyles: [], cssStyle: null }
  );
}
