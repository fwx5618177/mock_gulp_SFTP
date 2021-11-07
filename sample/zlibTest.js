const { ZLibFile } = require('../src/util/ZLibFile');

const tmp = new ZLibFile('./input.txt', 'input.txt.gz');

let deflateRe;
tmp.deflateFile('....').then(data => deflateRe = data);
// console.log('deflateRe:', deflateRe);
// tmp.unzipFile(re);
tmp.unzipFile('eJzT09PTAwAB0AC5');