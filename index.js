'use strict';
const path = require('path');
const fs = require('fs');
const gutil = require('gulp-util');
const through = require('through2');
const Connection = require('ssh2');
const async = require('async');
const parents = require('parents');

const normalizePath = function (path) {
    return path.replace(/\\/g, '/');
};

module.exports = function (options) {
    options = { ...options };// credit sindresorhus

    if (options.host === undefined) {
        throw new gutil.PluginError('GULP-SFTP', '`host` 必填.');
    }

    var fileCount = 0;
    var remotePath = options.remotePath || '/';
    var remotePlatform = options.remotePlatform || options.platform || 'unix';

    options.authKey = options.authKey || options.auth;
    var authFilePath = options.authFile || '.ftppass';
    var authFile = path.join('./', authFilePath);
    if (options.authKey && fs.existsSync(authFile)) {
        var auth = JSON.parse(fs.readFileSync(authFile, 'utf8'))[options.authKey];
        if (!auth)
            this.emit('error', new gutil.PluginError('GULP-SFTP', '没有在.ftppass中找到 authkey'));
        if (typeof auth == "string" && auth.indexOf(":") != -1) {
            var authparts = auth.split(":");
            auth = { user: authparts[0], pass: authparts[1] };
        }
        for (var attr in auth) { options[attr] = auth[attr]; }
    }

    //option aliases
    options.password = options.password || options.pass;
    options.username = options.username || options.user || 'anonymous';

    /*
     * Lots of ways to present key info
     */
    var key = options.key || options.keyLocation || null;
    if (key && typeof key == "string")
        key = { location: key };

    //check for other options that imply a key or if there is no password
    if (!key && (options.passphrase || options.keyContents || !options.password)) {
        key = {};
    }

    if (key) {
        //aliases
        key.contents = key.contents || options.keyContents;
        key.passphrase = key.passphrase || options.passphrase;

        //defaults
        key.location = key.location || ["~/.ssh/id_rsa", "/.ssh/id_rsa", "~/.ssh/id_dsa", "/.ssh/id_dsa"];

        //type normalization
        if (!Array.isArray(key.location))
            key.location = [key.location];

        //resolve all home paths
        if (key.location) {
            var home = process.env.HOME || process.env.USERPROFILE;
            for (var i = 0; i < key.location.length; i++)
                if (key.location[i].substr(0, 2) === '~/')
                    key.location[i] = path.resolve(home, key.location[i].replace(/^~\//, ""));
            for (var i = 0, keyPath; keyPath = key.location[i++];) {
                if (fs.existsSync(keyPath)) {
                    key.contents = fs.readFileSync(keyPath);
                    break;
                }
            }
        } else if (!key.contents) {
            this.emit('error', new gutil.PluginError('GULP-SFTP', '没有找到 RSA key, 搜索过: ' + key.location.join(', ')));
        }
    }
    /*
     * End Key normalization, key should now be of form:
     * {location:Array,passphrase:String,contents:String}
     * or null
     */

    var logFiles = options.logFiles === false ? false : true;
    delete options.remotePath;
    delete options.localPath;
    delete options.user;
    delete options.pass;
    delete options.logFiles;
    var mkDirCache = {};
    const removePath = remotePath
    var finished = false;
    var sftpCache = null;//sftp connection cache
    var connectionCache = null;//ssh connection cache

    var pool = function (remotePath, uploader) { // method to get cache or create connection
        if (sftpCache)
            return uploader(sftpCache);
        if (options.password) {
            gutil.log('当前使用的是密码进行身份验证。');
        } else if (key) {
            gutil.log('当前使用私钥进行身份验证。');
        }

        var c = new Connection();
        connectionCache = c;
        c.on('ready', function () {
            if (options.removeCurrentFolderFiles === true) {
                c.exec(`rm -rf ${removePath}`, (err, stream) => {
                    if (err) throw err;
                    stream.on('data', (data) => {
                        gutil.log('STDOUT: ' + data);
                    }).stderr.on('data', (data) => {
                        gutil.log('STDERR: ' + data);
                    });
                    gutil.log('提示: 远端文件删除成功');
                })
            }

            c.sftp(function (err, sftp) {
                if (err)
                    throw err;
                sftp.on('end', function () {
                    gutil.log('GULP-SFTP :: SFTP 连接关闭');
                    sftpCache = null;
                    if (!finished)
                        this.emit('error', new gutil.PluginError('GULP-SFTP', "SFTP 突然关闭"));
                });
                sftpCache = sftp;
                uploader(sftpCache);
            });
        });

        var self = this;
        c.on('error', function (err) {
            self.emit('error', new gutil.PluginError('GULP-SFTP', err));
        });
        c.on('end', function () {
            gutil.log('连接 :: 结束');
        });
        c.on('close', function (err) {
            if (!finished) {
                gutil.log('GULP-SFTP', "SFTP 突然关闭");
                self.emit('error', new gutil.PluginError('GULP-SFTP', "SFTP 突然关闭"));
            }
            if (err) {
                gutil.log('连接 :: 关闭, ', gutil.colors.red('Error: ' + err));
            } else {
                gutil.log('连接 :: 关闭');
            }
        });
        /*
         * connection options, may be a key
         */
        var connection_options = {
            host: options.host,
            port: options.port || 22,
            username: options.username
        };

        if (options.password) {
            connection_options.password = options.password;
        } else if (options.agent) {
            connection_options.agent = options.agent;
            connection_options.agentForward = options.agentForward || false;
        } else if (key) {
            connection_options.privateKey = key.contents;
            connection_options.passphrase = key.passphrase;
        }

        if (options.timeout) {
            connection_options.readyTimeout = options.timeout;
        }
        c.connect(connection_options);

    };
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            this.push(file);
            return cb();
        }
        // have to create a new connection for each file otherwise they conflict, pulled from sindresorhus
        var finalRemotePath = normalizePath(path.join(remotePath, file.relative));
        //connection pulled from pool
        pool.call(this, finalRemotePath, function (sftp) {
            /*
             *  Create Directories
             */
            //get dir name from file path
            var dirname = path.dirname(finalRemotePath);
            //get parents of the target dir
            var fileDirs = parents(dirname)
                .map(function (d) { return d.replace(/^\/~/, "~"); })
                .map(normalizePath);

            if (dirname.search(/^\//) === 0) {
                fileDirs = fileDirs.map(function (dir) {
                    if (dir.search(/^\//) === 0) {
                        return dir;
                    }
                    return '/' + dir;
                });
            }
            //get filter out dirs that are closer to root than the base remote path
            //also filter out any dirs made during this gulp session
            fileDirs = fileDirs.filter(function (d) { return d.length >= remotePath.length && !mkDirCache[d]; });
            //while there are dirs to create, create them
            //https://github.com/caolan/async#whilst - not the most commonly used async control flow
            async.whilst(function () {
                return fileDirs && fileDirs.length;
            }, function (next) {
                var d = fileDirs.pop();
                mkDirCache[d] = true;
                //mdrake - TODO: use a default file permission instead of defaulting to 755
                if (remotePlatform && remotePlatform.toLowerCase().indexOf('win') !== -1) {
                    d = d.replace('/', '\\');
                }
                sftp.exists(d, function (exist) {
                    if (!exist) {
                        sftp.mkdir(d, { mode: '0755' }, function (err) {//REMOTE PATH
                            if (err) {
                                gutil.log('SFTP 创建目录失败:', gutil.colors.red(err + " " + d));
                            } else {
                                gutil.log('SFTP 创建中:', gutil.colors.green(d));
                            }
                            next();
                        });
                    } else {
                        next();
                    }
                });
            }, function () {
                var stream = sftp.createWriteStream(finalRemotePath, {//REMOTE PATH
                    flags: 'w',
                    encoding: null,
                    mode: '0666',
                    autoClose: true
                });
                //var readStream = fs.createReadStream(fileBase+localRelativePath);
                var uploadedBytes = 0;
                var highWaterMark = stream.highWaterMark || (16 * 1000);
                var size = file.stat.size;

                // start upload (edit by Dan503 https://github.com/Dan503)
                if (file.isStream()) {
                    file.contents.pipe(stream);
                } else if (file.isBuffer()) {
                    stream.end(file.contents);
                }
                stream.on('drain', function () {
                    uploadedBytes += highWaterMark;
                    var p = Math.round((uploadedBytes / size) * 100);
                    p = Math.min(100, p);
                    gutil.log('GULP-SFTP:', finalRemotePath, "uploaded", (uploadedBytes / 1000) + "kb");
                });
                stream.on('close', function (err) {
                    if (err)
                        this.emit('error', new gutil.PluginError('GULP-SFTP', err));
                    else {
                        if (logFiles) {
                            gutil.log(gutil.colors.green('GULP-SFTP:'), gutil.colors.green('已上传: ') +
                                file.relative +
                                gutil.colors.green(' => ') +
                                finalRemotePath);
                        }
                        fileCount++;
                    }
                    return cb(err);
                });
            });
        });
        this.push(file);

    }, function (cb) {
        if (fileCount > 0) {
            gutil.log('GULP-SFTP:', gutil.colors.green(fileCount, fileCount === 1 ? '文件' : '文件', '上传成功'));
        } else {
            gutil.log('GULP-SFTP:', gutil.colors.yellow('未发现需要上传的文件'));
        }
        finished = true;
        if (sftpCache)
            sftpCache.end();
        if (connectionCache)
            connectionCache.end();
        cb();
    });
};
