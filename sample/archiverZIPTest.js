const { ArchiverFile } = require('../src/ArchiverFile');

const test = new ArchiverFile('../dist/test.zip', 'zip', '../src', 9);
test.archiverLib();
