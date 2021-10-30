#!/usr/local/bin/node
/**
 * Node-实现数据、文件的压缩
 *  - 压缩格式: zip
 * @param {string} outputArchiverName 最终压缩输出文件
 * @param {string} archiverType 压缩文件的类型
 * @param {string} directoryName 源文件的所在目录
 * @param {number} zlibLevel 压缩的质量
 * @param {JSON} remaindText 文件中提示语句，适用于国际化
 * @param {string} defaultLanguage 默认语言
 */

'use strict';

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const chalk = require('chalk');

class Archiver {
    outputArchiverName;
    archiverType;
    directoryName;
    zlibLevel;
    remaindText;
    defaultLanguage;

    constructor(
        outputArchiverName = 'dist.zip', 
        archiverType = 'zip', 
        directoryName = 'dist/',
        zlibLevel = 9,
        defaultLanguage = 'ZH-CN') {

            // 选择语言
            this.defaultLanguage = defaultLanguage;
            // 读取文件
            this.remaindText = JSON.parse(fs.readFileSync(
                path.resolve(__dirname, `./localScale/${this.defaultLanguage}.json`), 
                { encoding: 'utf-8' }
                ));
            // 判断传入参数是否为对象
            if (arguments.length === 1 &&
                Object.prototype.toString.call(arguments[0]) === '[object Object]') {
                    const {
                        outputArchiverName,
                        archiverType,
                        directoryName,
                        zlibLevel
                    } = arguments[0];

                    this.outputArchiverName = outputArchiverName;
                    this.archiverType = archiverType;
                    this.directoryName = directoryName;
                    this.zlibLevel = zlibLevel;
                } else {
                    // 非对象传入
                    this.outputArchiverName = outputArchiverName;
                    this.archiverType = archiverType;
                    this.directoryName = directoryName;
                    this.zlibLevel = zlibLevel;
                }
    }

    // archiverName设定和获取
    set outputArchiverName(value) {
        this.outputArchiverName = value;
    }

    get outputArchiverName() {
        return this.outputArchiverName;
    }

    // archiverType
    set archiverType(value) {
        this.archiverType = value;
    }

    get archiverType() {
        return this.archiverType;
    }

    // directoryName
    set directoryName(value) {
        this.directoryName = value;
    }

    get directoryName() {
        return this.directoryName;
    }

    // zlibLevel
    set zlibLevel(value) {
        this.zlibLevel = value;
    }

    get zlibLevel() {
        return this.zlibLevel;
    }

    // archive
    async archiverLib() {
        const outputFile = path.resolve(__dirname, this.outputArchiverName);
        const outputStream = fs.createWriteStream(outputFile);
        const archive = archiver(this.archiverType, {
            zlib: {
                level: this.zlibLevel,
            }
        });
        const text = this.remaindText.archiver;

        // 判断数据源目录文件是否存在
        const destDirectory = path.join(__dirname, this.directoryName);
        fs.access(destDirectory, fs.constants.R_OK | fs.constants.W_OK, err => {
            console.log(text.file.search);
            if (err) {
                console.log(chalk.bold.red(text.file.notExist));
                throw err;
            }else {
                console.log(chalk.bold.green(`${this.directoryName}${text.file.exist}`));
            }
        })

        outputStream.on('close', () => {
            console.log(chalk.bold.yellow(this.directoryName, text.file.transform, this.outputArchiverName))
            console.log(chalk.bold.magenta(text.close.size), archive.pointer());
            console.log(chalk.bold.green(text.close.remaind));
        })

        outputStream.on('end', () => {
            console.log(chalk.inverse.blue(text.end.remaind));
        })

        outputStream.on('error', err => {
            console.log(chalk.bold.bgRed(text.error.remaind, '\n Error:'));
            throw err;
        })

        outputStream.on('warning', err => {
            if(err.code === 'ENOENT') {
                console.log(chalk.italic.yellow('Warning:', err));
            }else {
                console.log(chalk.italic.yellow('Warning:'), '\n');
                throw err;
            }
        })

        // 判断输出文件是否存在，存在则删除
        fs.access(outputFile, fs.constants.R_OK | fs.constants.W_OK, err => {
            if (!err) {
                const a = this.rmFiles(outputFile)
                a.next()
                console.log(chalk.bold.blue(text.file.rm), chalk.bold.red(text.file.add));
            }

            archive.pipe(outputStream);
            archive.directory(path.resolve(__dirname, this.directoryName), false);
    
            archive.finalize();
        })

    }

    * rmFiles(file) {
        yield fs.rmSync(file);
    }
}

const test = new Archiver('test.zip', 'zip', '../src', 9);
test.archiverLib();