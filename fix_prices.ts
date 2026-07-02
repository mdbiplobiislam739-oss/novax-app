import fs from 'fs';

let content = fs.readFileSync('src/lib/store.ts', 'utf8');

// replace price: 4250, with price: 42.50
content = content.replace(/price: (\d+)(?=, imageUrl:)/g, (match, p1) => {
    return `price: ${parseFloat((Number(p1) / 10).toFixed(2))}`;
});

fs.writeFileSync('src/lib/store.ts', content);
console.log('Done');
