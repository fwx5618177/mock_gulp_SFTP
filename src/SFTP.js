#!/usr/local/bin/node
/**
 * 读取SFTP配置文件
 */
'use strict';

const gutil = require('gulp-util');
const path = require('path');
const fs = require('fs');

class SFTP {
    fileCount = 0;

    // 常见的配置项
    SFTP;
    remotePath;
    remotePlatform;
    authKey;
    authFilePath;
    authFile;

    /**
     * @func constructor 读取配置文件
     */
    constructor(options) {
        if (typeof options !== Object.prototype.toString().call({})) {
            throw new Error('options非object');
        }

        if (!options.SFTP || !options.host) throw new gutil.PluginError('GULP-SFTP', `host 为必填项`);

        this.remotePath = options.remotePath || '/';
        this.remotePlatform = options.remotePlatform 
            || options.platform 
            || 'unix';

        this.authKey = options.authKey || options.SFTP;
        this.authFilePath = options.authFile || '.env.sftp';
        this.authFile = path.join('./', this.authFilePath);

        if(!!this.authKey && fs.existsSync(this.authFile)) {
            let auth = JSON.parse(fs.readFileSync(this.authFile, { encoding: 'utf-8' }))[options.authKey];

            if(!auth) this.emit('error', new gutil.PluginError('GULP-SFTP', `没有找到${this.authFilePath}中的key`));
            if(typeof auth === 'string' && auth.includes(':')) {
                const authTmp = auth.split(':');

                auth = {
                    user: authTmp[0],
                    pass: authTmp[1],
                    host: authTmp[2],
                    port: authTmp[3],
                };
            }

        }
    }


}

module.exports = SFTP;