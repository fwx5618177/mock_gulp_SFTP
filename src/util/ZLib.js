#!/usr/local/bin/node
/**
 * zlib压缩文件
 */
'use strict';

const zlib = require('zlib');
const stream = require('stream');
const fs = require('fs');
const util = require('util');
const path = require('path');
const chalk = require('chalk');

class ZLib {
    gzip;
    source;
    destination;
    pipe;

    constructor(source, destination) {
        const sourceDir = path.resolve(__dirname, source);
        const destDir = path.resolve(__dirname, destination);

        console.log(chalk.bold.green('当前压缩类型为: gzip'));
        this.gzip = zlib.createGzip();
        this.source = fs.createReadStream(sourceDir);
        this.destination = fs.createWriteStream(destDir);
        this.pipe = util.promisify(stream.pipeline);
    }

    async do_gzip() {
        try {
            await this.pipe(this.source, this.gzip, this.destination);
        } catch(err) {
            console.log(chalk.bold.red('An error occurred:\n'), err);
            process.exitCode = 1;
        }
    }

    // 压缩数据
    deflateFile(input) {
        let delateData;
        zlib.deflate(input, (err, buffer) => {
            if (err) {
                console.log(chalk.bold.red('An error occurred:\n'), err);
                process.exitCode = 1;
            }

            console.log(buffer.toString('base64'));
            delateData = buffer.toString('base64');
        });

        return delateData;
    }

    // 解压缩数据
    unzipFile(bufferInput) {
        let unzipData;
        zlib.unzip(bufferInput, (err, buffer) => {
            if(err) {
                console.log(chalk.bold.red('An error occurred:\n'), err);
                process.exitCode = 1;
            }

            unzipData = buffer.toString();
            console.log(chalk.bold.green('Result:'), buffer.toString());
        })

        return unzipData;
    }
}