#!/usr/local/bin/node
/**
 * Name: Log
 * Instro:
 *  1. 打印成功和失败日志
 *  2. 日志类型：
 *      [时间] --- 行为
 *  3. 日志记录: Logs/Error.log, Common.log
 */
'use strict';

const moment = require('moment');

class Log {
    static ErrorLog(msg) {
        const time = moment(new Date()).format('YYYY-MM-DD hh:mm:ss');
        console.error(`\x1B[41m [${time}] --- ${msg} \x1B[0m`);
        console.trace(msg)
    }
 
    static SuccessLog(msg) {
        const time = moment(new Date()).format('YYYY-MM-DD hh:mm:ss');
        console.log(`\x1B[44m [${time}] --- ${msg} \x1B[0m`);
    }
}
 
module.exports = Log;