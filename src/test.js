const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

// const w = fs.createWriteStream(__dirname + '/w')

// const archive = archiver('zip', {
//     zlib: { level: 9 }
// })

// w.on('close', () => {
//     console.log(archive.pointer());
// })

// archive.pipe(w)
// archive.directory(__dirname + 'src', false);
// archive.finalize()

// console.log(path.basename('../src'));
async function test() {
    console.log(1);
    await console.log(2);
    await new Promise(resolve => {
        console.log(3)
        resolve()
    })
    console.log(fs.existsSync(path.resolve(__dirname, 'test.js')))
    console.log(4);
}

test()