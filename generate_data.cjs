const fs = require('fs');

const productCategories = [
  { name: 'Sneakers', keyword: 'sneakers' },
  { name: 'Jeans', keyword: 'jeans' },
  { name: 'Dress', keyword: 'dress' },
  { name: 'Handbag', keyword: 'handbag' },
  { name: 'T-Shirt', keyword: 'tshirt' },
  { name: 'Jacket', keyword: 'jacket' },
  { name: 'Watch', keyword: 'watch' },
  { name: 'Heels', keyword: 'heels' },
  { name: 'Jewelry', keyword: 'jewelry' },
  { name: 'Sunglasses', keyword: 'sunglasses' },
  { name: 'Makeup', keyword: 'makeup' },
  { name: 'Perfume', keyword: 'perfume' }
];

const nftKeywords = [
  'cryptoart', 'cyberpunk', 'abstractart', '3drender', 'digitalavatar', 
  'nft', 'pixelart', 'futuristic', 'surrealism', 'neon'
];

let nfts = [];
for (let i = 1; i <= 100; i++) {
  const keyword = nftKeywords[i % nftKeywords.length];
  const title = `Premium ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} #${Math.floor(1000 + Math.random() * 9000)}`;
  const imageUrl = `https://loremflickr.com/300/300/${keyword}?lock=${i}`;
  nfts.push(`{ id: 'nft-uniq-${i}', creatorId: 'system', ownerId: 'system', title: '${title}', description: 'Exclusive digital asset.', price: ${Math.floor(50 + Math.random() * 5000)}, imageUrl: '${imageUrl}', status: 'sale', createdAt: Date.now() }`);
}

let products = [];
for (let i = 1; i <= 100; i++) {
  const category = productCategories[i % productCategories.length];
  const name = `Luxury ${category.name} #${i}`;
  const imgUrl = `https://loremflickr.com/300/300/${category.keyword}?lock=${i}`;
  products.push(`{ id: 'prod-v2-${i}', name: '${name}', hash: 'Size ${36 + (i % 8)}', price: ${Math.floor(20 + Math.random() * 300)}, img: '${imgUrl}' }`);
}

let storeTs = fs.readFileSync('src/lib/store.ts', 'utf8');

const nftsString = `const initialNfts = [\n  ${nfts.join(',\n  ')}\n];`;
storeTs = storeTs.replace(/const initialNfts = \[[\s\S]*?\];/, nftsString);

const prodsString = `const initialProducts: Product\\[\\] = [\n  ${products.join(',\n  ')}\n];`;
storeTs = storeTs.replace(/const initialProducts: Product\[\] = \[[\s\S]*?\];/, prodsString);

storeTs = storeTs.replace(/if \(prodSnap\.size < 50\) {/g, 'if (!prodSnap.docs.find(d => d.id === "prod-v2-100")) {');
storeTs = storeTs.replace(/if \(nftSnap\.size < 50\) {/g, 'if (!nftSnap.docs.find(d => d.id === "nft-uniq-100")) {');

fs.writeFileSync('src/lib/store.ts', storeTs);
console.log('Updated store.ts with diverse products and NFTs using loremflickr');
