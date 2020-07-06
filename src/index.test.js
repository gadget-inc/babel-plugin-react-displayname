import path from 'path';
import { transformSync } from '@babel/core';

const plugin = path.join(__dirname, './index.js');

const transform = (code, pluginOptions) =>
  transformSync(code, {
    babelrc: false,
    configFile: false,
    plugins: [[plugin, pluginOptions]],
    presets: [['@babel/preset-react', { pure: false }]],
  }).code;

// transform with prefilled options
const transformWithOptions = (code) =>
  transform(code, {
    allowedCallees: {
      'react-fela': ['createComponent', 'createComponentWithProxy'],
    },
  });

describe('babelDisplayNamePlugin', () => {
  it('should add display name to function expression components', () => {
    expect(
      transform(`
      foo.bar = function() {
        return <img/>;
      }`)
    ).toMatchInlineSnapshot(`
      "foo.bar = function () {
        return React.createElement(\\"img\\", null);
      };

      foo.bar.displayName = \\"foo.bar\\";"
    `);

    expect(
      transform(`
      const Test = function() {
        return <img/>;
      }`)
    ).toMatchInlineSnapshot(`
      "const Test = function () {
        return React.createElement(\\"img\\", null);
      };

      Test.displayName = \\"Test\\";"
    `);
  });

  it('should add display name to named function expression components', () => {
    expect(
      transform(`
      foo.bar = function Foo() {
        return <img/>;
      }`)
    ).toMatchInlineSnapshot(`
      "foo.bar = function Foo() {
        return React.createElement(\\"img\\", null);
      };

      foo.bar.displayName = \\"foo.bar\\";"
    `);

    expect(
      transform(`
      const Test = function Foo() {
        return <img/>;
      }`)
    ).toMatchInlineSnapshot(`
      "const Test = function Foo() {
        return React.createElement(\\"img\\", null);
      };

      Test.displayName = \\"Test\\";"
    `);
  });

  it('should add display name to arrow function components', () => {
    expect(
      transform(`
      foo.bar = () => {
        return <img/>;
      }`)
    ).toMatchInlineSnapshot(`
      "foo.bar = () => {
        return React.createElement(\\"img\\", null);
      };

      foo.bar.displayName = \\"foo.bar\\";"
    `);

    expect(
      transform(`
      const Test = () => {
        return <img/>;
      };`)
    ).toMatchInlineSnapshot(`
      "const Test = () => {
        return React.createElement(\\"img\\", null);
      };

      Test.displayName = \\"Test\\";"
    `);

    expect(
      transform(`
      const Test = () => <img/>;`)
    ).toMatchInlineSnapshot(`
      "const Test = () => React.createElement(\\"img\\", null);

      Test.displayName = \\"Test\\";"
    `);

    expect(
      transform(`
      const Test = () => () => <img/>;`)
    ).toMatchInlineSnapshot(`"const Test = () => () => React.createElement(\\"img\\", null);"`);
  });

  it('should add display name to call expressions', () => {
    expect(
      transform(`
      const Test = React.memo(() => {
        return <img/>;
      })`)
    ).toMatchInlineSnapshot(`
      "const Test = React.memo(function _Test() {
        return React.createElement(\\"img\\", null);
      });
      Test.displayName = \\"Test\\";"
    `);

    expect(
      transform(`
      const foo = {
        bar: React.memo(() => {
          return <img/>;
        })
      };`)
    ).toMatchInlineSnapshot(`
      "const foo = {
        bar: React.memo(function _fooBar() {
          return React.createElement(\\"img\\", null);
        })
      };
      foo.bar.displayName = \\"foo.bar\\";"
    `);

    expect(
      transform(`
      const Test = React.memo(React.createRef((props, ref) => {
        return <img/>;
      }))`)
    ).toMatchInlineSnapshot(`
      "const Test = React.memo(React.createRef(function _Test(props, ref) {
        return React.createElement(\\"img\\", null);
      }));
      Test.displayName = \\"Test\\";"
    `);

    expect(
      transform(`
      const Test = React.memo(function _Test(props, ref) {
        return <img/>;
      })`)
    ).toMatchInlineSnapshot(`
      "const Test = React.memo(function _Test(props, ref) {
        return React.createElement(\\"img\\", null);
      });
      Test.displayName = \\"Test\\";"
    `);

    expect(
      transform(`
      export const Test = React.memo(() => {
        return <img/>;
      })`)
    ).toMatchInlineSnapshot(`
      "export const Test = React.memo(function _Test() {
        return React.createElement(\\"img\\", null);
      });
      Test.displayName = \\"Test\\";"
    `);
  });

  it('should add display name to allowed call expressions', () => {
    expect(
      transform(`
      import { createContext } from 'react';
      const FeatureContext = createContext();
      `)
    ).toMatchInlineSnapshot(`
      "import { createContext } from 'react';
      const FeatureContext = createContext();
      FeatureContext.displayName = \\"FeatureContext\\";"
    `);

    expect(
      transform(`
      import React from 'react';
      const FeatureContext = React.createContext();
      `)
    ).toMatchInlineSnapshot(`
      "import React from 'react';
      const FeatureContext = React.createContext();
      FeatureContext.displayName = \\"FeatureContext\\";"
    `);

    expect(
      transform(`
      import * as React from 'react';
      const FeatureContext = React.createContext();
      `)
    ).toMatchInlineSnapshot(`
      "import * as React from 'react';
      const FeatureContext = React.createContext();
      FeatureContext.displayName = \\"FeatureContext\\";"
    `);

    expect(
      transform(
        `
      import React from 'path/to/react';
      const FeatureContext = React.createContext();
      `,
        {
          allowedCallees: {
            'path/to/react': ['createContext'],
          },
        }
      )
    ).toMatchInlineSnapshot(`
      "import React from 'path/to/react';
      const FeatureContext = React.createContext();
      FeatureContext.displayName = \\"FeatureContext\\";"
    `);

    expect(
      transformWithOptions(`
      import { createComponent, createComponentWithProxy } from 'react-fela';
      foo.bar = createComponent();
      foo.bar1 = createComponentWithProxy();
      `)
    ).toMatchInlineSnapshot(`
      "import { createComponent, createComponentWithProxy } from 'react-fela';
      foo.bar = createComponent();
      foo.bar.displayName = \\"foo.bar\\";
      foo.bar1 = createComponentWithProxy();
      foo.bar1.displayName = \\"foo.bar1\\";"
    `);

    expect(
      transformWithOptions(`
      import { createComponent } from 'react-fela';
      foo = { bar: createComponent() }
      `)
    ).toMatchInlineSnapshot(`
      "import { createComponent } from 'react-fela';
      foo = {
        bar: createComponent()
      };
      foo.bar.displayName = \\"foo.bar\\";"
    `);

    expect(
      transformWithOptions(`
      import { createComponent } from 'react-fela';
      const Test = createComponent();
      `)
    ).toMatchInlineSnapshot(`
      "import { createComponent } from 'react-fela';
      const Test = createComponent();
      Test.displayName = \\"Test\\";"
    `);
  });

  it('should add display name to object property components', () => {
    expect(
      transform(`
      const Components = {
        path: {
          test: () => <img/>
        }
      };`)
    ).toMatchInlineSnapshot(`
      "const Components = {
        path: {
          test: () => React.createElement(\\"img\\", null)
        }
      };
      Components.path.test.displayName = \\"Components.path.test\\";"
    `);

    expect(
      transform(`
      const pathStr = 'path';
      const Components = {
        [pathStr]: {
          test: () => <img/>
        }
      };`)
    ).toMatchInlineSnapshot(`
      "const pathStr = 'path';
      const Components = {
        [pathStr]: {
          test: () => React.createElement(\\"img\\", null)
        }
      };
      Components[pathStr].test.displayName = \\"Components[pathStr].test\\";"
    `);

    expect(
      transform(`
      const Components = {
        test: function() { return <img/> }
      };`)
    ).toMatchInlineSnapshot(`
      "const Components = {
        test: function () {
          return React.createElement(\\"img\\", null);
        }
      };
      Components.test.displayName = \\"Components.test\\";"
    `);

    expect(
      transform(`
      const Components = {
        test: function Foo() { return <img/> }
      };`)
    ).toMatchInlineSnapshot(`
      "const Components = {
        test: function Foo() {
          return React.createElement(\\"img\\", null);
        }
      };
      Components.test.displayName = \\"Components.test\\";"
    `);
  });

  it('should add display name to object methods', () => {
    expect(
      transform(`
      const Components = {
        path: {
          test(props) {
            return <img/>;
          },
        }
      };
      `)
    ).toMatchInlineSnapshot(`
      "const Components = {
        path: {
          test(props) {
            return React.createElement(\\"img\\", null);
          }

        }
      };
      Components.path.test.displayName = \\"Components.path.test\\";"
    `);

    expect(
      transform(`
      const Components = {
        [foo[bar.foobar].baz]: {
          test(props) {
            return <img/>;
          },
        }
      };
      `)
    ).toMatchInlineSnapshot(`
      "const Components = {
        [foo[bar.foobar].baz]: {
          test(props) {
            return React.createElement(\\"img\\", null);
          }

        }
      };
      Components[foo[bar.foobar].baz].test.displayName = \\"Components[foo[bar.foobar].baz].test\\";"
    `);
  });

  it('should add display name to fragments', () => {
    expect(
      transform(`
      const Component = (props) => <><img {...props} /></>;
      `)
    ).toMatchInlineSnapshot(`
      "const Component = props => React.createElement(React.Fragment, null, React.createElement(\\"img\\", props));

      Component.displayName = \\"Component\\";"
    `);
  });

  it('should add display name to various expressions', () => {
    expect(
      transform(`
      const Component = () => false ? <img/> : null;
      const Component1 = () => <img/> || null;
      const Component2 = () => [<img/>];
      const Component3 = () => { return <img/> };

      `)
    ).toMatchInlineSnapshot(`
      "const Component = () => false ? React.createElement(\\"img\\", null) : null;

      Component.displayName = \\"Component\\";

      const Component1 = () => React.createElement(\\"img\\", null) || null;

      Component1.displayName = \\"Component1\\";

      const Component2 = () => [React.createElement(\\"img\\", null)];

      Component2.displayName = \\"Component2\\";

      const Component3 = () => {
        return React.createElement(\\"img\\", null);
      };

      Component3.displayName = \\"Component3\\";"
    `);
  });

  it('should add display name for various kinds of assignments', () => {
    expect(
      transform(`
      var Test = () => <img/>
      `)
    ).toMatchInlineSnapshot(`
      "var Test = () => React.createElement(\\"img\\", null);

      Test.displayName = \\"Test\\";"
    `);

    expect(
      transform(`
      let Test = () => <img/>
      `)
    ).toMatchInlineSnapshot(`
      "let Test = () => React.createElement(\\"img\\", null);

      Test.displayName = \\"Test\\";"
    `);

    expect(
      transform(`
      export const Test = () => <img/>
      `)
    ).toMatchInlineSnapshot(`
      "export const Test = () => React.createElement(\\"img\\", null);
      Test.displayName = \\"Test\\";"
    `);
  });

  it('should not add display names for nameless functions', () => {
    expect(
      transformWithOptions(`
      export default () => <img/>
      `)
    ).toMatchInlineSnapshot(`"export default (() => React.createElement(\\"img\\", null));"`);

    expect(
      transformWithOptions(`
      (() => <img/>)()
      `)
    ).toMatchInlineSnapshot(`"(() => React.createElement(\\"img\\", null))();"`);

    expect(
      transformWithOptions(`
      {() => <img/>}
      `)
    ).toMatchInlineSnapshot(`
      "{
        () => React.createElement(\\"img\\", null);
      }"
    `);

    expect(
      transformWithOptions(`
      (function() { return <img/> })()
      `)
    ).toMatchInlineSnapshot(`
      "(function () {
        return React.createElement(\\"img\\", null);
      })();"
    `);

    expect(
      transformWithOptions(`
      (function test() { return <img/> })()
      `)
    ).toMatchInlineSnapshot(`
      "(function test() {
        return React.createElement(\\"img\\", null);
      })();"
    `);

    expect(
      transformWithOptions(`
      export default function() { return <img/> }
      `)
    ).toMatchInlineSnapshot(`
      "export default function () {
        return React.createElement(\\"img\\", null);
      }"
    `);
  });

  it('should not move elements out of their current scope', () => {
    expect(
      transformWithOptions(`
      const Component = (props) => <>{() => <img {...props} />}</>;
      `)
    ).toMatchInlineSnapshot(`
      "const Component = props => React.createElement(React.Fragment, null, () => React.createElement(\\"img\\", props));

      Component.displayName = \\"Component\\";"
    `);

    expect(
      transformWithOptions(`
      styledComponents.withTheme = (Component) => {
        const WithDefaultTheme = (props) => {
          return <div {...props} />;
        }
        return WithDefaultTheme;
      };
      `)
    ).toMatchInlineSnapshot(`
      "styledComponents.withTheme = Component => {
        const WithDefaultTheme = props => {
          return React.createElement(\\"div\\", props);
        };

        WithDefaultTheme.displayName = \\"WithDefaultTheme\\";
        return WithDefaultTheme;
      };"
    `);

    expect(
      transformWithOptions(`
      const Component = (options) => {
        return {
          test: function test(props) {
            return <img/>
          },
        };
      };
      `)
    ).toMatchInlineSnapshot(`
      "const Component = options => {
        return {
          test: function test(props) {
            return React.createElement(\\"img\\", null);
          }
        };
      };"
    `);

    expect(
      transformWithOptions(`
      const Component = (props) => ({ test: <img {...props} /> });
      `)
    ).toMatchInlineSnapshot(`
      "const Component = props => ({
        test: React.createElement(\\"img\\", props)
      });"
    `);

    expect(
      transformWithOptions(`
      const Component = (props) => {
        const LookUp = ((innerProps) => ({ a: () => <img {...innerProps} /> }))(props);
        return <div>{() => LookUp.a}</div>
      };
      `)
    ).toMatchInlineSnapshot(`
      "const Component = props => {
        const LookUp = (innerProps => ({
          a: () => React.createElement(\\"img\\", innerProps)
        }))(props);

        return React.createElement(\\"div\\", null, () => LookUp.a);
      };

      Component.displayName = \\"Component\\";"
    `);
  });

  it('should add not overwrite existing display names', () => {
    expect(
      transformWithOptions(`
      foo.bar = () => <img/>;
      foo.bar.displayName = 'test';
      `)
    ).toMatchInlineSnapshot(`
      "foo.bar = () => React.createElement(\\"img\\", null);

      foo.bar.displayName = 'test';"
    `);

    expect(
      transformWithOptions(`
      foo.bar = () => <img/>;
      foo.bar.displayName = 'test';
      foo.bar = () => <img/>;
      `)
    ).toMatchInlineSnapshot(`
      "foo.bar = () => React.createElement(\\"img\\", null);

      foo.bar.displayName = 'test';

      foo.bar = () => React.createElement(\\"img\\", null);

      foo.bar.displayName = \\"foo.bar\\";"
    `);

    expect(
      transformWithOptions(`
      foo.bar = () => <img/>;
      foo.bar.displayName = 'foo.bar';
      foo.bar = () => <img/>;
      `)
    ).toMatchInlineSnapshot(`
      "foo.bar = () => React.createElement(\\"img\\", null);

      foo.bar.displayName = 'foo.bar';

      foo.bar = () => React.createElement(\\"img\\", null);

      foo.bar.displayName = \\"foo.bar\\";"
    `);
  });

  it('should not add duplicate display names', () => {
    expect(
      transformWithOptions(`
      () => {
        const Test = () => <img/>;
      }
      const Test = () => <img/>;
      `)
    ).toMatchInlineSnapshot(`
      "() => {
        const Test = () => React.createElement(\\"img\\", null);

        Test.displayName = \\"Test\\";
      };

      const Test = () => React.createElement(\\"img\\", null);"
    `);
  });

  it('should not change assignment orders', () => {
    expect(
      transformWithOptions(`
      foo.bar = () => <img/>;
      foo.bar = () => <br/>;
      `)
    ).toMatchInlineSnapshot(`
      "foo.bar = () => React.createElement(\\"img\\", null);

      foo.bar.displayName = \\"foo.bar\\";

      foo.bar = () => React.createElement(\\"br\\", null);

      foo.bar.displayName = \\"foo.bar\\";"
    `);

    expect(
      transformWithOptions(`
      foo.bar = () => <img/>;
      delete foo.bar;
      `)
    ).toMatchInlineSnapshot(`
      "foo.bar = () => React.createElement(\\"img\\", null);

      foo.bar.displayName = \\"foo.bar\\";
      delete foo.bar;"
    `);

    expect(
      transformWithOptions(`
      foo.bar = () => <img/>;
      function irrelvant() {};
      foo = null;
      `)
    ).toMatchInlineSnapshot(`
      "foo.bar = () => React.createElement(\\"img\\", null);

      foo.bar.displayName = \\"foo.bar\\";

      function irrelvant() {}

      ;
      foo = null;"
    `);
  });

  it('should not add display name to object properties', () => {
    expect(
      transformWithOptions(`
      const Components = {
        path: {
          test: <img/>
        }
      };`)
    ).toMatchInlineSnapshot(`
      "const Components = {
        path: {
          test: React.createElement(\\"img\\", null)
        }
      };"
    `);

    expect(
      transformWithOptions(`
      const Components = () => ({
        path: {
          test: <img/>
        }
      });`)
    ).toMatchInlineSnapshot(`
      "const Components = () => ({
        path: {
          test: React.createElement(\\"img\\", null)
        }
      });"
    `);

    expect(
      transformWithOptions(`
      const Components = callee({ foo: () => <img/> });
      `)
    ).toMatchInlineSnapshot(`
      "const Components = callee({
        foo: () => React.createElement(\\"img\\", null)
      });"
    `);

    expect(
      transformWithOptions(`
      const Components = () => <div>{() => <img/>}</div>;
      `)
    ).toMatchInlineSnapshot(`
      "const Components = () => React.createElement(\\"div\\", null, () => React.createElement(\\"img\\", null));

      Components.displayName = \\"Components\\";"
    `);
  });

  it('should not add display name to createClass', () => {
    expect(
      transformWithOptions(`
      const Component2 = _createClass(() => <img/>);
      `)
    ).toMatchInlineSnapshot(
      `"const Component2 = _createClass(() => React.createElement(\\"img\\", null));"`
    );
  });

  it('should not add display name to hooks', () => {
    expect(
      transformWithOptions(`
      const Component = useMemo(() => <img/>);
      `)
    ).toMatchInlineSnapshot(
      `"const Component = useMemo(() => React.createElement(\\"img\\", null));"`
    );
  });

  it('should not add display name to class components', () => {
    expect(
      transformWithOptions(`
      class Test extends React.Component {
        render() {
          return <img/>;
        }
      }`)
    ).toMatchInlineSnapshot(`
      "class Test extends React.Component {
        render() {
          return React.createElement(\\"img\\", null);
        }

      }"
    `);

    expect(
      transformWithOptions(`
      class Test extends React.Component {
        notRender() {
          return <img/>;
        }
      }`)
    ).toMatchInlineSnapshot(`
      "class Test extends React.Component {
        notRender() {
          return React.createElement(\\"img\\", null);
        }

      }"
    `);

    expect(
      transformWithOptions(`
      export class Test extends React.Component {
        render() {
          return <img/>;
        }
      }`)
    ).toMatchInlineSnapshot(`
      "export class Test extends React.Component {
        render() {
          return React.createElement(\\"img\\", null);
        }

      }"
    `);

    expect(
      transformWithOptions(`
      export default class Test extends React.Component {
        render() {
          return <img/>;
        }
      }`)
    ).toMatchInlineSnapshot(`
      "export default class Test extends React.Component {
        render() {
          return React.createElement(\\"img\\", null);
        }

      }"
    `);
  });

  it('should not add display name to function components', () => {
    expect(
      transformWithOptions(`
      function Test() {
        return <img/>;
      }`)
    ).toMatchInlineSnapshot(`
      "function Test() {
        return React.createElement(\\"img\\", null);
      }"
    `);

    expect(
      transformWithOptions(`
      export function Test() {
        return <img/>;
      }`)
    ).toMatchInlineSnapshot(`
      "export function Test() {
        return React.createElement(\\"img\\", null);
      }"
    `);

    expect(
      transformWithOptions(`
      export default function Test() {
        return <img/>;
      }`)
    ).toMatchInlineSnapshot(`
      "export default function Test() {
        return React.createElement(\\"img\\", null);
      }"
    `);

    expect(
      transformWithOptions(`
      export default function() {
        return <img/>;
      }`)
    ).toMatchInlineSnapshot(`
      "export default function () {
        return React.createElement(\\"img\\", null);
      }"
    `);
  });

  it('should not add display name to unknown call expressions', () => {
    expect(
      transformWithOptions(`
      import { createDirectionalComponent } from 'react-fela';
      foo.bar = createDirectionalComponent();
      `)
    ).toMatchInlineSnapshot(`
      "import { createDirectionalComponent } from 'react-fela';
      foo.bar = createDirectionalComponent();"
    `);

    expect(
      transformWithOptions(`
      import fela from 'react-fela';
      foo.bar = fela.createDirectionalComponent();
      `)
    ).toMatchInlineSnapshot(`
      "import fela from 'react-fela';
      foo.bar = fela.createDirectionalComponent();"
    `);

    expect(
      transformWithOptions(`
      import * as fela from 'react-fela';
      foo.bar = fela.createDirectionalComponent();
      `)
    ).toMatchInlineSnapshot(`
      "import * as fela from 'react-fela';
      foo.bar = fela.createDirectionalComponent();"
    `);
  });

  it('should not add display name to immediately invoked function expressions', () => {
    expect(
      transformWithOptions(`
      const Test = (function () {
        return <img/>;
      })()`)
    ).toMatchInlineSnapshot(`
      "const Test = function () {
        return React.createElement(\\"img\\", null);
      }();"
    `);

    expect(
      transformWithOptions(`
      const Test = (function test() {
        return <img/>;
      })()`)
    ).toMatchInlineSnapshot(`
      "const Test = function test() {
        return React.createElement(\\"img\\", null);
      }();"
    `);

    expect(
      transformWithOptions(`
      const Test = (() => {
        return <img/>;
      })()`)
    ).toMatchInlineSnapshot(`
      "const Test = (() => {
        return React.createElement(\\"img\\", null);
      })();"
    `);
  });

  it('should not add display name to functions within jsx elements', () => {
    expect(
      transformWithOptions(`
      const Test = callee(<div>{() => <img/>}</div>);
      `)
    ).toMatchInlineSnapshot(
      `"const Test = callee(React.createElement(\\"div\\", null, () => React.createElement(\\"img\\", null)));"`
    );

    expect(
      transformWithOptions(`
      const Test = () => <img foo={{ bar: () => <img/> }} />;
      `)
    ).toMatchInlineSnapshot(`
      "const Test = () => React.createElement(\\"img\\", {
        foo: {
          bar: () => React.createElement(\\"img\\", null)
        }
      });

      Test.displayName = \\"Test\\";"
    `);
  });

  it('should not add display name to non react components', () => {
    expect(
      transformWithOptions(`
      // foo.bar = createComponent();
      const Component = '';
      const Component1 = null;
      const Component2 = undefined;
      const Component3 = 0;
      let Component4;
      var Component5;
      const Component6 = ['foo', 5, null, undefined];
      const Component7 = { foo: 'bar' };
      const Component8 = new Wrapper();
      const Component9 = () => {};
      `)
    ).toMatchInlineSnapshot(`
      "// foo.bar = createComponent();
      const Component = '';
      const Component1 = null;
      const Component2 = undefined;
      const Component3 = 0;
      let Component4;
      var Component5;
      const Component6 = ['foo', 5, null, undefined];
      const Component7 = {
        foo: 'bar'
      };
      const Component8 = new Wrapper();

      const Component9 = () => {};"
    `);
  });

  it('should not add display name to other assignments', () => {
    expect(
      transformWithOptions(`
      const Component = <img/>;
      const Component1 = [<img/>];
      const Component2 = new Wrapper(<img/>);
      const Component3 = async (props) => await <img/>;
      const Component4 = callee(<img/>);
      `)
    ).toMatchInlineSnapshot(`
      "const Component = React.createElement(\\"img\\", null);
      const Component1 = [React.createElement(\\"img\\", null)];
      const Component2 = new Wrapper(React.createElement(\\"img\\", null));

      const Component3 = async props => await React.createElement(\\"img\\", null);

      const Component4 = callee(React.createElement(\\"img\\", null));"
    `);
  });
});
