const fs = require('fs');
const path = require('path');
const changelog = require('conventional-changelog');

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const appRoot = '.';
const paths = {
  root: appRoot,
  source: appRoot + '**/*.js',
  html: appRoot + '**/*.html',
  style: 'styles/**/*.css',
  output: 'dist/',
  doc:'./doc',
  e2eSpecsSrc: 'test/e2e/src/*.js',
  e2eSpecsDist: 'test/e2e/dist/',
  packageName: pkg.name
};

changelog(
  {
    repository: pkg.repository.url,
    version: pkg.version,
    file: paths.doc + '/CHANGELOG.md'
  },
  function(err, log) {
    fs.writeFileSync(paths.doc + '/CHANGELOG.md', log);
  }
);
