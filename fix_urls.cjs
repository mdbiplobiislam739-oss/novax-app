const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

walk('./src', (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        
        newContent = newContent.replace(/\/https:\/\/cryptologos\.cc\/logos\/toncoin-ton-logo\.png/g, 'https://cryptologos.cc/logos/toncoin-ton-logo.svg?v=024');
        newContent = newContent.replace(/https:\/\/cryptologos\.cc\/logos\/toncoin-ton-logo\.png/g, 'https://cryptologos.cc/logos/toncoin-ton-logo.svg?v=024');
        newContent = newContent.replace(/https:\/\/cryptologos\.cc\/logos\/tron-https:\/\/cryptologos\.cc\/logos\/toncoin-ton-logo\.png\?v=024/g, 'https://cryptologos.cc/logos/toncoin-ton-logo.svg?v=024');
        newContent = newContent.replace(/https:\/\/cryptologos\.cc\/logos\/tron-trx-logo\.png/g, 'https://cryptologos.cc/logos/toncoin-ton-logo.svg?v=024');
        
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent);
            console.log(`Updated ${filePath}`);
        }
    }
});
