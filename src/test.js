const archiver = require('archiver');
const fs = require('fs');

const w = fs.createWriteStream(__dirname + '/w')

const archive = archiver('zip', {
    zlib: { level: 9 }
})

w.on('close', () => {
    console.log(archive.pointer());
})

archive.pipe(w)
archive.directory(__dirname + 'src', false);
archive.finalize()