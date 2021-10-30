#!/usr/local/bin/node
/**
 * zlib压缩文件
 */
'use strict';

const zlib = require('zlib');
const stream = require('stream');
const fs = require('fs');

class ZLib {
    gzip = zlib.createGzip();
    source = fs.createReadStream('test.txt');
    destination = fs.createWriteStream('test.txt.gz');
}