# [gulp-sftp-up5](https://www.npmjs.com/package/gulp-sftp-up5)

> 一个简单用于 linux/win 的 sftp 程序，在（gulp-sftp-up4）的基础上进行改进，它可以实现当你打包以后自动将你的打包文件发送到远端服务器，不用借助于 gitlab 和 jenkins,但需要 package.json 的配合

## 安装

```
npm install --save-dev gulp-sftp-up5
// or
yarn add gulp-sftp-up5 -D
```

## 提示

> 如果你是 vue 或者 react，你可以配置的 package.json 的执行脚本，通过 cross-env 设置环境变量来调用 deploy.js 中的配置

```
 "scripts": {
    "dev": "vue-cli-service serve --mode dev",
    "build:test": "vue-cli-service build --mode build_test && cross-env APP_ENV=test npm run deploy",
    "build:prod": "vue-cli-service build --mode build_prod && cross-env APP_ENV=prod npm run deploy",
    "deploy": "node ./deploy.js"
  }

```
### 使用方式一（不安全）
```js
// deploy.js

/**
 * 部署之前请检查好要部署的路径
 * 如有多个环境，自行拓展
 */
const gulp = require("gulp")
const sftp = require("gulp-sftp-up5")
const CONFIG = require("./vue.config") // 只是为了保证上传的文件夹一致

const sftpConfig = {
  // 此处的key对应着package.json中脚本的 APP_ENV
  test: {
    remotePath: "/service/web", // 部署到服务器的路径
    host: "192.168.0.99", // 服务器地址
    user: "root", // 帐号
    pass: "1433223", // 密码
    port: 22, // 端口
    removeCurrentFolderFiles: true, // 该属性可删除 remotePath 下的所有文件/文件夹
  },
  prod: {
    remotePath: "/service/web", // 部署到服务器的路径
    host: "127.0.0.1", // 服务器地址
    user: "root", // 帐号
    pass: "1433223", // 密码
    port: 22, // 端口
    removeCurrentFolderFiles: true,
  },
}

// 采用管道流的方式将 outputDir 中的文件上传到远端
gulp.src("./" + CONFIG.outputDir + "/**").pipe(sftp(sftpConfig[process.env.APP_ENV]))
```


### 使用方式二（需配置SFTP属性）
* 为了提高安全性，请将配置信息保存在名为`.env.sftp`的 json 格式的文件中（或保存为 options.authFile 设置的任何值）。 **请确保将此文件添加到.gitignore** 。
```
// .env.sftp  请严格按照JSON格式
{
  "test": {
    "user": "root",
    "pass": "123456",
    "host": "192.168.0.1",
    "port": 22
  },
  "prod": {
    "user": "root",
    "pass": "123456",
    "host": "192.168.0.",
    "port": 22
  }
}
```
```js
// deploy.js

/**
 * 部署之前请检查好要部署的路径
 * 如有多个环境，自行拓展
 */
const gulp = require("gulp")
const sftp = require("gulp-sftp-up5")
const CONFIG = require("./vue.config") // 只是为了保证上传的文件夹一致

const sftpConfig = {
  // 此处的key对应着package.json中脚本的 APP_ENV
  test: {
    remotePath: "/service/web", // 部署到服务器的路径
    SFTP: 'test', // 对应着.env.sftp的可以
    removeCurrentFolderFiles: true, // 该属性可删除 remotePath 下的所有文件/文件夹
  },
  prod: {
    remotePath: "/service/web", // 部署到服务器的路径
    SFTP: 'prod',
    removeCurrentFolderFiles: true,
  },
}

// 采用管道流的方式将 outputDir 中的文件上传到远端
gulp.src("./" + CONFIG.outputDir + "/**").pipe(sftp(sftpConfig[process.env.APP_ENV]))
```

## 配置参数

### sftp(options)

#### options.host

_Required_  
Type: `String`

#### options.port

Type: `Number`  
Default: `22`

#### options.user / username

Type: `String`  
Default: `"anonymous"`

#### options.pass / password

Type: `String`  
Default: `null`

如果未设置此选项，则 gulp-sftp 假定用户正在使用私钥身份验证，并且默认情况下将在以下位置使用密钥：

`~/.ssh/id_dsa` and `/.ssh/id_rsa`

如果您打算使用匿名登录，请使用值"@anonymous"。

#### options.remotePath

Type: `String`  
Default: `"/"`

上载到的远程路径。 如果此路径尚不存在，则会创建该路径以及包含文件的子目录。

#### options.remotePlatform

Type: `String`
Default: `"unix"`

您要上传到的远程平台。 如果目标服务器是 Windows 计算机，则使用值“ windows”。

#### options.key

type `String` or `Object`
Default: `null`

密钥文件位置。 如果是对象，请使用以下格式 `{location:"/path/to/file",passphrase:"secretphrase"}`

#### options.passphrase

type `String`
Default: `null`

密钥身份验证的密码。 如果您的密钥不需要密码，请留空。

#### options.keyContents

type `String`
Default: `null`

如果您希望直接通过 gulp 传递密钥，可以通过将其设置为 options.keyContents 来实现。

#### options.SFTP

type `String`
Default: `null`

用于从 .env.sftp 访问身份验证信息的标识符，可使用 authFile 自定义文件名称。

#### options.authFile

type `String`
Default: `.ftppass`

相对于项目根目录的路径，该路径是包含身份验证信息的 JSON 格式文件的路径。

#### options.timeout

type `int`
Default: Currently set by ssh2 as `10000` milliseconds.

一个整数，以毫秒为单位，指定等待服务器响应的时间。

#### options.agent

type `String`
Default: `null`

ssh-agent 的 UNIX 套接字的路径，用于基于 ssh-agent 的用户身份验证。

#### options.agentForward

type `bool`
Default: `false`

设置为 true 以使用 OpenSSH 代理转发。 要求配置“ options.agent”。

#### options.callback

type `function`
Default: `null`

SFTP 连接关闭后将调用回调函数。

#### options.removeCurrentFolderFiles

type `bool`
Default: `false`

用于删除文件夹（remotePath）远端对应的文件夹底下的所有文件，规避了历史文件的冗余，有一定的风险，请务确保路径的正确


#### options.customCommand

type `String`
Default: `null`

用于添加可执行自定义命令行，它操作的命令行一般都在 remotePath 目录下运行，当然，你也可以通过自定义命令行去控制执行路径，不过此风险相当大，慎用


如要使用 pem 创建私钥和证书来访问服务器：

```js
var pem = require("pem")
gulp.task("deploy:test", function () {
  pem.createCertificate({}, function (err, kyes) {
    return gulp.src("./src/**/*").pipe(
      sftp({
        host: "testserver.com",
        user: "testuser",
        pass: "testpass",
        key: kyes.clientKey,
        keyContents: kyes.keyContents,
      })
    )
  })
})
```
