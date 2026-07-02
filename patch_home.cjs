const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

const target = `<div className="text-white/80 text-xs sm:text-sm font-medium mb-1">
            {t("Total Balance")}
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mb-4 drop-shadow-md truncate">
            {formatXRP(user?.balance || 0)}
          </div>`;

const replacement = `<div className="flex justify-between items-center mb-1">
            <div className="text-white/80 text-xs sm:text-sm font-medium">
              {t("Total Balance")}
            </div>
            <select
                value={selectedBalanceTokenId}
                onChange={(e) => setSelectedBalanceTokenId(e.target.value)}
                className="bg-white/20 border-none text-white font-bold text-xs px-2 py-1 rounded-md outline-none"
            >
                {tokens.map(t => (
                    <option key={t.symbol} value={t.symbol} className="text-black">{t.symbol}</option>
                ))}
            </select>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mb-4 drop-shadow-md truncate">
            {selectedBalanceTokenId === "XRP" 
               ? formatXRP(user?.balance || 0) 
               : \`\${(user?.balances?.[selectedBalanceTokenId] || 0).toFixed(2)} \${selectedBalanceTokenId}\`}
          </div>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/Home.tsx', code);
