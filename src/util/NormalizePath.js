#!/usr/local/bin/node
/**
 * 对引入路径的一些替换和判断
 */
'use strict';

const path = require('path');

class NormalizePath {
    /**
     * @function standardPath 用于同一化路径
     * @param {string} path 输入绝对路径
     */
    static standardPath(path) {
        return path.replace(/\\/g, '/');
    }
}

module.exports = NormalizePath;