import typescript from 'rollup-plugin-typescript2';

const MODULE_NAME = 'aurelia-web-components';

export default [
  {
    input: `src/${MODULE_NAME}.ts`,
    output: [
      {
        file: `dist/es2015/${MODULE_NAME}.js`,
        format: 'esm',
        sourcemap: true
      },
      {
        file: `dist/umd-es2015/${MODULE_NAME}.js`,
        format: 'umd',
        name: 'au.webComponents',
        globals: {
          'aurelia-metadata': 'au',
          'aurelia-binding': 'au',
          'aurelia-dependency-injection': 'au',
          'aurelia-pal': 'au',
          'aurelia-templating': 'au',
          'aurelia-templating-resources': 'au',
        },
        sourcemap: true
      }
    ],
    plugins: [
      typescript({
        cacheRoot: '.rollupcache',
        tsconfigOverride: {
          compilerOptions: {
            removeComments: true,
          }
        }
      })
    ]
  },
  {
    input: `src/${MODULE_NAME}.ts`,
    output: {
      file: `dist/es2017/${MODULE_NAME}.js`,
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      typescript({
        cacheRoot: '.rollupcache',
        tsconfigOverride: {
          compilerOptions: {
            target: 'es2017',
            removeComments: true,
          }
        }
      })
    ]
  },
  {
    input: `src/${MODULE_NAME}.ts`,
    output: [
      { file: `dist/amd/${MODULE_NAME}.js`, format: 'amd', id: MODULE_NAME, sourcemap: true },
      { file: `dist/commonjs/${MODULE_NAME}.js`, format: 'cjs', sourcemap: true },
      { file: `dist/system/${MODULE_NAME}.js`, format: 'system', sourcemap: true },
      { file: `dist/native-modules/${MODULE_NAME}.js`, format: 'esm', sourcemap: true },
    ],
    plugins: [
      typescript({
        cacheRoot: '.rollupcache',
        tsconfigOverride: {
          compilerOptions: {
            target: 'es5',
            removeComments: true,
          }
        }
      })
    ]
  },
  {
    input: `src/${MODULE_NAME}.ts`,
    output: {
      file: `dist/umd/${MODULE_NAME}.js`,
      format: 'umd',
      name: 'au.webComponents',
      globals: {
        'aurelia-metadata': 'au',
        'aurelia-binding': 'au',
        'aurelia-dependency-injection': 'au',
        'aurelia-pal': 'au',
        'aurelia-templating': 'au',
        'aurelia-templating-resources': 'au',
      },
      sourcemap: true
    },
    plugins: [
      typescript({
        cacheRoot: '.rollupcache',
        tsconfigOverride: {
          compilerOptions: {
            target: 'es5',
            removeComments: true,
          }
        }
      })
    ]
  },
].map(config => {
  config.external = [
    'aurelia-metadata',
    'aurelia-binding',
    'aurelia-dependency-injection',
    'aurelia-pal',
    'aurelia-templating',
    'aurelia-templating-resources'
  ];
  return config;
});
