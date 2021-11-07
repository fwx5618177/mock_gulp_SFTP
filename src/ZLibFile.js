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

class ZLibFile {
    gzip;
    source;
    destination;
    pipe;

    constructor(source, destination) {
        const sourceDir = path.resolve(source);
        const destDir = path.resolve(destination);

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
        let deflateData;

        return new Promise((resolve, reject) => {
            zlib.deflate(input, (err, buffer) => {
                if (err) {
                    console.log(chalk.bold.red('An error occurred:\n'), err);
                    reject(err);
                    process.exitCode = 1;
                }
    
                console.log(chalk.bold.bgCyanBright('deflateFile result:'), buffer.toString('base64'));
                deflateData = buffer.toString('base64');

                // console.log('deflateData:', deflateData);

                resolve(deflateData);
            });
        })
    }

    // 解压缩数据
    unzipFile(bufferInput) {
        const buff = Buffer.from(bufferInput, 'base64');
        let unzipData;
        return new Promise((resolve, reject) => {
            zlib.unzip(buff, (err, buffer) => {
                if(err) {
                    console.log(chalk.bold.red('An error occurred:\n'), err);
                    reject(err);
                    process.exitCode = 1;
                }
    
                unzipData = buffer.toString();
                console.log(chalk.bold.bgBlueBright('Result:'), buffer.toString());

                resolve(unzipData);
            })
        });
    }
}

module.exports = {
    ZLibFile
}