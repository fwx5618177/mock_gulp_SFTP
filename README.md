# gulp-sftp-up5

## 一个简单用于linux/win的sftp程序，在（gulp-sftp-up4）的基础上进行改进，它可以实现当你打包以后自动将你的打包文件发送到远端服务器，不用借助于gitlab和jenkins,但需要package.json的配合


[![NPM][(https://www.npmjs.com/package/gulp-sftp-up5)]

## 安装 

```
npm install --save-dev gulp-sftp-up5
yarn add gulp-sftp-up5 -D
```


## 提示

### 如果你是vue或者react，你可以配置的package.json的执行脚本，当你运行  npm run build:test  的以后你可以接着运行  npm run deploy，可以实现简单的前端自动化部署

```
"scripts": {
    "dev": "vue-cli-service serve --mode dev",
    "build:test": "vue-cli-service build --mode build_test && npm run deploy",
    "build:prod": "vue-cli-service build --mode build_prod",
    "deploy": "node ./deploy.js"
  }
```

```js
// deploy.js

/**
 * 部署之前请检查好要部署的路径
 * 仅限测试环境自动部署
 */
const gulp = require('gulp') //需安装 gulp
const sftp = require('gulp-sftp-up5')
const CONFIG = 'dist' // 当前打包后生成的文件夹
const sftpConfig = {
  remotePath: '/service/app/web', // 部署到服务器的路径
  host: '192.168.0.1', // 服务器地址
  user: 'root', // 帐号
  pass: '1433223', // 密码
  port: 22, // 端口
  removeCurrentFolderFiles: true // 删除远端 remotePath 所对应的web目录底下所有文件再将 文件发布过去
}

gulp.src('./' + CONFIG.outputDir + '/**').pipe(sftp(sftpConfig))
```



## API 保留了之前gulp-sftp-up4所有的API，添加了远端文件删除的属性

### sftp(options)

#### options.host

*Required*  
Type: `String`

#### options.port

Type: `Number`  
Default: `22`

#### options.user / username

Type: `String`  
Default: `'anonymous'`

#### options.pass / password

Type: `String`  
Default: `null`

If this option is not set, gulp-sftp assumes the user is using private key authentication and will default to using keys at the following locations:

`~/.ssh/id_dsa` and `/.ssh/id_rsa`

If you intend to use anonymous login, use the value '@anonymous'.

#### options.remotePath

Type: `String`  
Default: `'/'`

The remote path to upload to. If this path does not yet exist, it will be created, as well as the child directories that house your files.

#### options.remotePlatform

Type: `String`
Default: `'unix'`

The remote platform that you are uploading to. If your destination server is a Windows machine, use the value `windows`.

#### options.key

type `String` or `Object`
Default: `null`

A key file location. If an object, please use the format `{location:'/path/to/file',passphrase:'secretphrase'}`


#### options.passphrase

type `String`
Default: `null`

A passphrase for secret key authentication. Leave blank if your key does not need a passphrase.

#### options.keyContents

type `String`
Default: `null`

If you wish to pass the key directly through gulp, you can do so by setting it to options.keyContents.

#### options.auth

type `String`
Default: `null`

An identifier to access authentication information from `.ftppass` see [Authentication](#authentication) for more information.

#### options.authFile

type `String`
Default: `.ftppass`

A path relative to the project root to a JSON formatted file containing auth information.

#### options.timeout
type `int`
Default: Currently set by ssh2 as `10000` milliseconds.

An integer in milliseconds specifying how long to wait for a server response.

#### options.agent
type `String`
Default: `null`

Path to ssh-agent's UNIX socket for ssh-agent-based user authentication.

#### options.agentForward
type `bool`
Default: `false`

Set to true to use OpenSSH agent forwarding. Requires that `options.agent` is configured.

#### options.callback
type `function`
Default: `null`

Callback function to be called once the SFTP connection is closed.


#### options.removeCurrentFolderFiles
type `bool`
Default: `false`

**这是我加的参数，用于删除文件夹（remotePath）远端对应的文件夹底下的所有文件，规避了历史文件的冗余，有一定的风险，请务确保路径的正确**


## Authentication

For better security, save authentication data in a json formatted file named `.ftppass` (or to whatever value you set options.authFile to). **Be sure to add this file to .gitignore**. You do not typically want auth information stored in version control.

```js
var gulp = require('gulp');
var sftp = require('gulp-sftp');

gulp.task('default', function () {
	return gulp.src('src/*')
		.pipe(sftp({
			host: 'website.com',
			auth: 'keyMain'
		}));
});
```

`.ftppass`

```json
{
  "keyMain": {
    "user": "username1",
    "pass": "password1"
  },
  "keyShort": "username1:password1",
  "privateKey": {
    "user": "username"
  },
  "privateKeyEncrypted": {
    "user": "username",
    "passphrase": "passphrase1"
  },
  "privateKeyCustom": {
    "user": "username",
    "passphrase": "passphrase1",
    "keyLocation": "/full/path/to/key"
  }
}
```


## Work with [pem](https://github.com/andris9/pem)

To use [pem](https://github.com/andris9/pem) create private keys and certificates for access your server: 

```js
var pem = require('pem');
gulp.task('deploy:test', function () {
    pem.createCertificate({}, function (err, kyes) {
        return gulp.src('./src/**/*')
            .pipe(sftp({
                host: 'testserver.com',
                user: 'testuser',
                pass: 'testpass',
                key: kyes.clientKey,
                keyContents: kyes.keyContents
            }));
    });
});
```

