const fs = require('fs');

function updateFile(file, matchStr, varName) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('usePreferredCurrency')) {
    // find last import
    const lastImportIndex = content.lastIndexOf('import ');
    const endOfLastImport = content.indexOf('\n', lastImportIndex);
    content = content.slice(0, endOfLastImport + 1) + "import { usePreferredCurrency } from '../hooks/usePreferredCurrency';\n" + content.slice(endOfLastImport + 1);
  }
  
  content = content.replace(matchStr, `const [${varName}, set${varName.charAt(0).toUpperCase() + varName.slice(1)}] = usePreferredCurrency('XRP');`);
  
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
}

updateFile('src/pages/Finance.tsx', 'const [selectedTokenId, setSelectedTokenId] = useState("XRP"); // XRP default', 'selectedTokenId');
updateFile('src/pages/Home.tsx', 'const [selectedBalanceTokenId, setSelectedBalanceTokenId] = useState("XRP");', 'selectedBalanceTokenId');
updateFile('src/pages/Staking.tsx', 'const [selectedCurrencyId, setSelectedCurrencyId] = useState("XRP"); // default XRP', 'selectedCurrencyId');
updateFile('src/pages/Shop.tsx', "const [selectedTokenId, setSelectedTokenId] = useState('XRP');", 'selectedTokenId');
updateFile('src/pages/Sports.tsx', "const [selectedTokenId, setSelectedTokenId] = useState('USDT');", 'selectedTokenId');

