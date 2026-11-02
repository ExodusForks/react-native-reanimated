import { parseSync, transformSync } from '@babel/core';
import traverse from '@babel/traverse';
import { strict as assert } from 'assert';
import { execFileSync } from 'child_process';
import { runInNewContext } from 'vm';
import plugin from '../plugin';

type TestWorklet = ((...args: unknown[]) => unknown) & {
  __closure: Record<string, unknown>;
  __initData: {
    __reanimated_workletCodeWrapper: Record<symbol, string>;
  };
  _recur?: TestWorklet;
};

function compileWorklet(input: string) {
  const transformed = transformSync(input, {
    filename: '/worklet.js',
    babelrc: false,
    configFile: false,
    plugins: [
      [plugin, { disableSourceMaps: true }],
      '@babel/plugin-transform-block-scoping',
    ],
  });
  assert(transformed?.code);

  const worklet = runInNewContext(
    `globalThis.global = globalThis;\n${transformed.code}\nworklet;`
  ) as TestWorklet;
  const source =
    worklet.__initData.__reanimated_workletCodeWrapper[
      Symbol.for('__reanimated_workletCode')
    ];
  const ast = parseSync(`(${source})`, {
    babelrc: false,
    configFile: false,
  });
  assert(ast);
  traverse(ast, {
    VariableDeclaration(path) {
      // Hermes compiles these declarations with var semantics by default.
      expect(path.node.kind).toBe('var');
    },
  });

  const uiFunction = runInNewContext(`(${source})`) as TestWorklet;
  const uiWorklet = uiFunction.bind(worklet);
  worklet._recur = uiWorklet;
  return {
    worklet,
    uiWorklet: (...args: unknown[]) => {
      const result = uiWorklet(...args);
      if (process.env.HERMES_BINARY) {
        const output = execFileSync(process.env.HERMES_BINARY, ['-exec', '-'], {
          encoding: 'utf8',
          input: `
            var receiver = { __closure: ${JSON.stringify(worklet.__closure)} };
            var worklet = (${source}).bind(receiver);
            receiver._recur = worklet;
            print(JSON.stringify(worklet.apply(null, ${JSON.stringify(args)})));
          `,
        });
        expect(output.trim()).toBe(JSON.stringify(result));
      }
      return result;
    },
  };
}

describe('worklet block scoping', () => {
  it.each([
    ['function declaration', 'function worklet()', ''],
    ['function expression', 'const worklet = function()', ';'],
    ['arrow function', 'const worklet = () =>', ';'],
    [
      'object method',
      'const holder = { worklet()',
      '}; const worklet = holder.worklet;',
    ],
  ])('preserves loop captures in a %s', (_name, declaration, suffix) => {
    const { worklet, uiWorklet } = compileWorklet(`
      const offset = 10;
      ${declaration} {
        'worklet';
        const callbacks = [];
        for (let index = 0; index < 3; index++) {
          callbacks.push(() => offset + index);
        }
        return callbacks.map(callback => callback());
      }${suffix}
    `);

    expect(Object.keys(worklet.__closure)).toEqual(['offset']);
    expect(worklet()).toEqual([10, 11, 12]);
    expect(uiWorklet()).toEqual([10, 11, 12]);
  });

  it('preserves shadowed bindings and resets uninitialized loop locals', () => {
    const { uiWorklet } = compileWorklet(`
      function worklet() {
        'worklet';
        let value = 20;
        const values = [];
        {
          let value = 30;
          values.push(value);
        }
        for (let index = 0; index < 3; index++) {
          let current;
          if (index !== 1) current = index;
          values.push(current);
        }
        return [value, values];
      }
    `);

    expect(uiWorklet()).toEqual([20, [30, 0, undefined, 2]]);
  });

  it('keeps a captured binding distinct from a shadowing local', () => {
    const { worklet, uiWorklet } = compileWorklet(`
      const value = 10;
      function worklet() {
        'worklet';
        const values = [value];
        {
          let value = 20;
          values.push(value);
        }
        return [...values, value];
      }
    `);

    expect(Object.keys(worklet.__closure)).toEqual(['value']);
    expect(uiWorklet()).toEqual([10, 20, 10]);
  });

  it.each(['value = 2', 'value += 2', 'value++', '[value] = [2]'])(
    'preserves const reassignment errors for %s',
    (assignment) => {
      const { worklet, uiWorklet } = compileWorklet(`
        function worklet() {
          'worklet';
          const TypeError = 'shadowed';
          const value = 1;
          try {
            ${assignment};
          } catch (error) {
            return [error.name, TypeError];
          }
          return 'missing error';
        }
      `);

      expect(Object.keys(worklet.__closure)).toEqual([]);
      expect(uiWorklet()).toEqual(['TypeError', 'shadowed']);
    }
  );

  it('allows updates to a captured mutable binding', () => {
    const { worklet, uiWorklet } = compileWorklet(`
      let value = 1;
      function worklet() {
        'worklet';
        value += 1;
        return value;
      }
    `);

    expect(Object.keys(worklet.__closure)).toEqual(['value']);
    expect(uiWorklet()).toBe(2);
    expect(uiWorklet()).toBe(2);
  });

  it('preserves recursion and external captures with generated helpers', () => {
    const { worklet, uiWorklet } = compileWorklet(`
      const offset = 10;
      function worklet(depth) {
        'worklet';
        if (depth > 0) return worklet(depth - 1) + 1;
        const value = 1;
        try {
          value = 2;
        } catch (error) {
          return offset;
        }
      }
    `);

    expect(Object.keys(worklet.__closure)).toEqual(['offset']);
    expect(uiWorklet(3)).toBe(13);
  });
});
