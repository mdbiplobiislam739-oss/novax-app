import { useEffect, useState } from "react";
import { store } from "../../lib/store";
import { Transaction, User, Product } from "../../types";
import { formatXRP, generateId } from "../../lib/utils";
import {
  Users,
  CreditCard,
  Activity,
  Bell,
  Box,
  Edit,
  Trash,
  Plus,
  ShieldAlert,
  ShieldCheck,
  X,
  Copy,
  ArrowDown,
  ArrowUp,
  Newspaper
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [nfts, setNfts] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "users"
    | "kyc"
    | "products"
    | "stakes"
    | "deposits"
    | "withdrawals"
    | "settings"
    | "games"
    | "nfts"
  >("overview");

  // Product Edit Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [prodForm, setProdForm] = useState({
    name: "",
    hash: "",
    price: "0",
    img: "",
  });

  // NFT Edit Modal
  const [editingNFT, setEditingNFT] = useState<any>(null);
  const [isAddingNFT, setIsAddingNFT] = useState(false);
  const [nftForm, setNftForm] = useState({
    title: "",
    description: "",
    price: "0",
    imageUrl: "",
    status: "sale"
  });

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    balance: "0",
    vipLevel: 0,
    password: "",
  });
  const [viewedUserHistory, setViewedUserHistory] = useState<
    Transaction[] | null
  >(null);
  const [viewingKycPhoto, setViewingKycPhoto] = useState<string | null>(null);

  const [supportLink, setSupportLink] = useState("");
  const [stakeSettings, setStakeSettings] = useState({
    interestRate: 90,
    minStake: 100,
    maxStake: 4000,
  });
  const [vipLevels, setVipLevels] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  const [editingMethod, setEditingMethod] = useState<any | null>(null);
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [methodForm, setMethodForm] = useState({
    name: "",
    network: "",
    address: "",
  });
  const [banners, setBanners] = useState<string[]>([]);
  const [billboardText, setBillboardText] = useState("");
  const [billboardEnabled, setBillboardEnabled] = useState(true);
  const [referralBonusText, setReferralBonusText] = useState("");
  const [depositBonusText, setDepositBonusText] = useState("");
  const [referralSystemEnabled, setReferralSystemEnabled] = useState(true);
  const [referralLevel1Rate, setReferralLevel1Rate] = useState(10);
  const [referralLevel2Rate, setReferralLevel2Rate] = useState(5);
  const [referralLevel3Rate, setReferralLevel3Rate] = useState(2);
  const [dailyRewards, setDailyRewards] = useState<number[]>([2, 5, 10, 15, 20, 30, 50]);
  const [gameCrashWinRate, setGameCrashWinRate] = useState(48);
  const [gameRocketWinRate, setGameRocketWinRate] = useState(48);
  const [gameCoinWinRate, setGameCoinWinRate] = useState(48);
  const [gameDiceWinRate, setGameDiceWinRate] = useState(48);
  const [gameSlotsWinRate, setGameSlotsWinRate] = useState(48);
  const [gameFishWinRate, setGameFishWinRate] = useState(48);
  const [gameCoinFlipEnabled, setGameCoinFlipEnabled] = useState(true);
  const [gameDiceRollEnabled, setGameDiceRollEnabled] = useState(true);
  const [gameCrashEnabled, setGameCrashEnabled] = useState(true);
  const [gameSlotsEnabled, setGameSlotsEnabled] = useState(true);
  const [gameFishEnabled, setGameFishEnabled] = useState(false);
  const [gameWheelEnabled, setGameWheelEnabled] = useState(true);
  const [gameMinesEnabled, setGameMinesEnabled] = useState(true);
  const [gamePlinkoEnabled, setGamePlinkoEnabled] = useState(true);
  const [gameTowerEnabled, setGameTowerEnabled] = useState(true);

  const refreshData = () => {
    const state = store.getState();
    setUsers(state.users);
    setTxs(state.transactions);
    setProducts(state.products);
    setNfts(state.nfts || []);
    setSupportLink(state.supportLink || "");
    setStakeSettings(
      state.stakeSettings || {
        interestRate: 90,
        minStake: 100,
        maxStake: 4000,
      },
    );
    setVipLevels(state.vipLevels || []);
    setPaymentMethods(state.paymentMethods || []);
    setBanners(state.banners || []);
    setBillboardText(
      state.billboardText !== undefined
        ? state.billboardText
        : "Welcome to NovaX! Start your earning journey today.",
    );
    setBillboardEnabled(
      state.billboardEnabled !== undefined ? state.billboardEnabled : true,
    );
    setReferralBonusText(
      state.referralBonusText !== undefined
        ? state.referralBonusText
        : "Invite friends and earn rewards!\n\n• 50 Active Referrals = 100 XRP Bonus\n• 100 Active Referrals = 200 XRP Bonus\n• 500 Active Referrals = 1,000 XRP Bonus\n\n*Note: Active referrals mean your friends must make a deposit.",
    );
    setDepositBonusText(
      state.depositBonusText !== undefined
        ? state.depositBonusText
        : "Top up your account to unlock additional XRP Rewards tailored for new members.\n\n• Deposit 100 XRP = 10% Bonus\n• Deposit 500 XRP = 15% Bonus\n• Deposit 1000+ XRP = 20% Bonus",
    );
    setReferralSystemEnabled(
      state.referralSystemEnabled !== undefined
        ? state.referralSystemEnabled
        : true,
    );
    setReferralLevel1Rate(
      state.referralLevel1Rate !== undefined ? state.referralLevel1Rate : 10,
    );
    setReferralLevel2Rate(
      state.referralLevel2Rate !== undefined ? state.referralLevel2Rate : 5,
    );
    setReferralLevel3Rate(
      state.referralLevel3Rate !== undefined ? state.referralLevel3Rate : 2,
    );
    setDailyRewards(state.dailyRewards || [2, 5, 10, 15, 20, 30, 50]);
    setGameCrashWinRate(state.gameCrashWinRate !== undefined ? state.gameCrashWinRate : 48);
    setGameRocketWinRate(state.gameRocketWinRate !== undefined ? state.gameRocketWinRate : 48);
    setGameCoinWinRate(state.gameCoinWinRate !== undefined ? state.gameCoinWinRate : 48);
    setGameDiceWinRate(state.gameDiceWinRate !== undefined ? state.gameDiceWinRate : 48);
    setGameSlotsWinRate(state.gameSlotsWinRate !== undefined ? state.gameSlotsWinRate : 48);
    setGameFishWinRate(state.gameFishWinRate !== undefined ? state.gameFishWinRate : 48);
    setGameCoinFlipEnabled(state.gameCoinFlipEnabled !== undefined ? state.gameCoinFlipEnabled : true);
    setGameDiceRollEnabled(state.gameDiceRollEnabled !== undefined ? state.gameDiceRollEnabled : true);
    setGameCrashEnabled(state.gameCrashEnabled !== undefined ? state.gameCrashEnabled : true);
    setGameSlotsEnabled(state.gameSlotsEnabled !== undefined ? state.gameSlotsEnabled : true);
    setGameFishEnabled(state.gameFishEnabled !== undefined ? state.gameFishEnabled : false);
    setGameWheelEnabled(state.gameWheelEnabled !== undefined ? state.gameWheelEnabled : true);
    setGameMinesEnabled(state.gameMinesEnabled !== undefined ? state.gameMinesEnabled : true);
    setGamePlinkoEnabled(state.gamePlinkoEnabled !== undefined ? state.gamePlinkoEnabled : true);
    setGameTowerEnabled(state.gameTowerEnabled !== undefined ? state.gameTowerEnabled : true);
  };

  useEffect(() => {
    refreshData();
    const handleUpdate = () => refreshData();
    window.addEventListener("store_updated", handleUpdate);
    return () => window.removeEventListener("store_updated", handleUpdate);
  }, []);

  const pendingDeposits = txs.filter(
    (t) => t.type === "deposit" && t.status === "pending",
  );
  const pendingWithdraws = txs.filter(
    (t) => t.type === "withdraw" && t.status === "pending",
  );

  const handleBlockUser = (id: string, isBlocked: boolean) => {
    store.updateUser(id, { isBlocked });
    refreshData();
  };

  const handleDeleteUser = async (id: string) => {
    await store.deleteUser(id);
    refreshData();
  };

  const handleApproveDeposit = async (tx: Transaction) => {
    await store.updateTransaction(tx.id, { status: "completed" });
    const state = store.getState();
    const user = state.users.find((u) => u.id === tx.userId);
    if (user) {
      const uBal = user.balance || 0;
      const uTot = user.totalEarnings || 0;
      await store.updateUser(user.id, {
        balance: uBal + tx.amount,
        totalEarnings: uTot + tx.amount,
      });

      const allUsers = state.users;

      if (state.referralSystemEnabled !== false && user.referrerId) {
        const rate1 =
          (state.referralLevel1Rate !== undefined
            ? state.referralLevel1Rate
            : 10) / 100;
        const rate2 =
          (state.referralLevel2Rate !== undefined
            ? state.referralLevel2Rate
            : 5) / 100;
        const rate3 =
          (state.referralLevel3Rate !== undefined
            ? state.referralLevel3Rate
            : 2) / 100;

        // L1
        const l1 = allUsers.find(
          (u) =>
            (u.username || "").trim().toLowerCase() ===
            user.referrerId!.trim().toLowerCase(),
        );
        if (l1 && rate1 > 0) {
          const r1 = tx.amount * rate1;
          await store.updateUser(l1.id, {
            balance: (l1.balance || 0) + r1,
            totalEarnings: (l1.totalEarnings || 0) + r1,
          });
          await store.addTransaction({
            userId: l1.id,
            type: "reward",
            amount: r1,
            status: "completed",
            description: `Team Level 1 Reward (${user.username})`,
          });

          // L2
          if (l1.referrerId && rate2 > 0) {
            const l2 = allUsers.find(
              (u) =>
                (u.username || "").trim().toLowerCase() ===
                l1.referrerId!.trim().toLowerCase(),
            );
            if (l2) {
              const r2 = tx.amount * rate2;
              await store.updateUser(l2.id, {
                balance: (l2.balance || 0) + r2,
                totalEarnings: (l2.totalEarnings || 0) + r2,
              });
              await store.addTransaction({
                userId: l2.id,
                type: "reward",
                amount: r2,
                status: "completed",
                description: `Team Level 2 Reward (${user.username})`,
              });

              // L3
              if (l2.referrerId && rate3 > 0) {
                const l3 = allUsers.find(
                  (u) =>
                    (u.username || "").trim().toLowerCase() ===
                    l2.referrerId!.trim().toLowerCase(),
                );
                if (l3) {
                  const r3 = tx.amount * rate3;
                  await store.updateUser(l3.id, {
                    balance: (l3.balance || 0) + r3,
                    totalEarnings: (l3.totalEarnings || 0) + r3,
                  });
                  await store.addTransaction({
                    userId: l3.id,
                    type: "reward",
                    amount: r3,
                    status: "completed",
                    description: `Team Level 3 Reward (${user.username})`,
                  });
                }
              }
            }
          }
        }
      }
    }
    refreshData();
  };

  const handleRejectDeposit = (tx: Transaction) => {
    store.updateTransaction(tx.id, { status: "rejected" });
    refreshData();
  };

  const handleApproveWithdraw = (tx: Transaction) => {
    store.updateTransaction(tx.id, { status: "completed" });
    refreshData();
  };

  const handleRejectWithdraw = (tx: Transaction) => {
    store.updateTransaction(tx.id, { status: "rejected" });
    const user = store.getState().users.find((u) => u.id === tx.userId);
    if (user) {
      store.updateUser(user.id, { balance: user.balance + tx.amount }); // refund
    }
    refreshData();
  };

  const handleDeleteProduct = (id: string) => {
    store.deleteProduct(id);
    refreshData();
  };

  const handleSaveProduct = () => {
    if (isAddingProduct) {
      store.addProduct({
        name: prodForm.name,
        hash: prodForm.hash,
        price: parseFloat(prodForm.price) || 0,
        img: prodForm.img,
      });
    } else if (editingProduct) {
      store.updateProduct(editingProduct.id, {
        name: prodForm.name,
        hash: prodForm.hash,
        price: parseFloat(prodForm.price) || 0,
        img: prodForm.img,
      });
    }
    setEditingProduct(null);
    setIsAddingProduct(false);
    refreshData();
  };

  const openEditNFT = (nft: any) => {
    setEditingNFT(nft);
    setNftForm({
      title: nft.title || "",
      description: nft.description || "",
      price: nft.price?.toString() || "0",
      imageUrl: nft.imageUrl || "",
      status: nft.status || "sale"
    });
  };

  const openAddNFT = () => {
    setIsAddingNFT(true);
    setNftForm({ title: "", description: "", price: "0", imageUrl: "", status: "sale" });
  };

  const handleSaveNFT = async () => {
    if (editingNFT) {
      await store.updateNFT(editingNFT.id, {
        title: nftForm.title,
        description: nftForm.description,
        price: parseFloat(nftForm.price),
        imageUrl: nftForm.imageUrl,
        status: nftForm.status
      });
      setEditingNFT(null);
    } else {
      await store.createNFT({
        title: nftForm.title,
        description: nftForm.description,
        price: parseFloat(nftForm.price),
        imageUrl: nftForm.imageUrl,
        status: nftForm.status,
        creatorId: "system",
        ownerId: "system"
      });
      setIsAddingNFT(false);
    }
    refreshData();
  };

  const handleDeleteNFT = async (id: string) => {
    if (window.confirm("Delete this NFT?")) {
      await store.deleteNFT(id); // Wait, deleteNFT might not exist yet
      refreshData();
    }
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdForm({
      name: p.name,
      hash: p.hash,
      price: p.price.toString(),
      img: p.img,
    });
  };

  const openAddProduct = () => {
    setIsAddingProduct(true);
    setProdForm({ name: "", hash: "", price: "0", img: "" });
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setUserForm({
      balance: u.balance.toString(),
      vipLevel: u.vipLevel,
      password: u.password || "",
    });
  };

  const handleSaveUser = () => {
    if (editingUser) {
      const updates: any = {
        balance: parseFloat(userForm.balance) || 0,
        vipLevel: userForm.vipLevel,
      };

      const newPass = userForm.password || editingUser.password;
      if (newPass) {
        updates.password = newPass;
      }

      store.updateUser(editingUser.id, updates);
      setEditingUser(null);
      refreshData();
    }
  };

  const openUserHistory = (userId: string) => {
    const history = store
      .getState()
      .transactions.filter((t) => t.userId === userId && t.type === "mining")
      .sort((a, b) => b.timestamp - a.timestamp);
    setViewedUserHistory(history);
  };

  const handleSaveMethod = () => {
    if (isAddingMethod) {
      store.addPaymentMethod(methodForm);
    } else if (editingMethod) {
      store.updatePaymentMethod(editingMethod.id, methodForm);
    }
    setEditingMethod(null);
    setIsAddingMethod(false);
    refreshData();
  };

  const openEditMethod = (m: any) => {
    setEditingMethod(m);
    setMethodForm({ name: m.name, network: m.network, address: m.address });
  };

  const handleDeleteMethod = (id: string) => {
    store.deletePaymentMethod(id);
    refreshData();
  };

  const handleApproveKyc = (userId: string) => {
    store.updateUser(userId, { kycStatus: "approved" });
    refreshData();
  };

  const handleRejectKyc = (userId: string) => {
    store.updateUser(userId, { kycStatus: "rejected" });
    refreshData();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-text-muted">
            Manage users, products, and finances.
          </p>
        </div>
        <div className="flex gap-2 p-1 bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-xl overflow-x-auto whitespace-nowrap scrollbar-hide">
          <TabButton
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
            label="Overview"
          />
          <TabButton
            active={activeTab === "users"}
            onClick={() => setActiveTab("users")}
            label="Users"
          />
          <TabButton
            active={activeTab === "kyc"}
            onClick={() => setActiveTab("kyc")}
            label="KYC Verifications"
          />
          <TabButton
            active={activeTab === "products"}
            onClick={() => setActiveTab("products")}
            label="Products"
          />
          <TabButton
            active={activeTab === "nfts"}
            onClick={() => setActiveTab("nfts")}
            label="NFTs"
          />
          <TabButton
            active={activeTab === "stakes"}
            onClick={() => setActiveTab("stakes")}
            label="Stakes"
          />
          <TabButton
            active={activeTab === "deposits"}
            onClick={() => setActiveTab("deposits")}
            label="Deposits"
          />
          <TabButton
            active={activeTab === "withdrawals"}
            onClick={() => setActiveTab("withdrawals")}
            label="Withdrawals"
          />
          <TabButton
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
            label="Settings"
          />
          <TabButton
            active={activeTab === "games"}
            onClick={() => setActiveTab("games")}
            label="Game Control"
          />
        </div>
      </div>

      {activeTab === "stakes" && (
        <div className="glass-panel p-6 rounded-3xl overflow-x-auto">
          <h2 className="text-xl font-bold mb-6">User Stakes</h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-text-muted border-b border-[var(--color-border-card)]">
                <th className="pb-3 font-medium">User ID</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Duration</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-card)]">
              {(store.getState().stakes || []).map((stake) => {
                const u = users.find((u) => u.id === stake.userId);
                return (
                  <tr
                    key={stake.id}
                    className="hover:bg-[var(--color-bg-base)] transition-colors"
                  >
                    <td className="py-4 font-medium">
                      {u?.username || stake.userId.substring(0, 6)}
                    </td>
                    <td className="py-4 font-bold text-brand-gold">
                      {formatXRP(stake.amount)}
                    </td>
                    <td className="py-4 text-xs">
                      {stake.durationMonths} Months
                    </td>
                    <td className="py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                          stake.status === "active"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-green-500/10 text-green-500"
                        }`}
                      >
                        {stake.status}
                      </span>
                    </td>
                    <td className="py-4 text-right space-x-2">
                      {stake.status === "active" && (
                        <button
                          onClick={() => {
                            store.updateStake(stake.id, {
                              status: "completed",
                            });
                            refreshData();
                          }}
                          className="p-1 px-2 text-xs bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-md"
                        >
                          Complete
                        </button>
                      )}
                      <button
                        onClick={() => {
                          store.deleteStake(stake.id);
                          refreshData();
                        }}
                        className="p-1 px-2 text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {(store.getState().stakes || []).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted">
                    No stakes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "deposits" && (
        <div className="glass-panel p-6 rounded-3xl overflow-x-auto">
          <h2 className="text-xl font-bold mb-6">Deposit Requests</h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-text-muted border-b border-[var(--color-border-card)]">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">User ID</th>
                <th className="pb-3 font-medium">Transaction ID</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-card)]">
              {txs
                .filter((t) => t.type === "deposit")
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((tx) => {
                  const u = users.find((u) => u.id === tx.userId);
                  const txId = tx.description || tx.address || "-";
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-[var(--color-bg-base)] transition-colors"
                    >
                      <td className="py-4 text-text-muted text-xs">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="py-4 font-medium">
                        {u?.username || tx.userId.substring(0, 6)}
                      </td>
                      <td className="py-4 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="max-w-[150px] truncate" title={txId}>
                            {txId}
                          </span>
                          {txId !== "-" && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(txId);
                                alert("Transaction ID copied!");
                              }}
                              className="text-text-muted hover:text-white p-1"
                            >
                              <Copy size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 font-bold text-brand-gold">
                        {formatXRP(tx.amount)}
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                            tx.status === "pending"
                              ? "bg-yellow-500/10 text-yellow-500"
                              : tx.status === "completed"
                                ? "bg-green-500/10 text-green-500"
                                : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-4 text-right space-x-2">
                        {tx.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApproveDeposit(tx)}
                              className="p-1.5 px-3 text-xs bg-green-500/10 text-green-500 font-bold hover:bg-green-500/20 rounded-lg"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectDeposit(tx)}
                              className="p-1.5 px-3 text-xs bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 rounded-lg"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              {txs.filter((t) => t.type === "deposit").length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">
                    No deposit requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "withdrawals" && (
        <div className="glass-panel p-6 rounded-3xl overflow-x-auto">
          <h2 className="text-xl font-bold mb-6">Withdrawal Requests</h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-text-muted border-b border-[var(--color-border-card)]">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">User ID</th>
                <th className="pb-3 font-medium">Withdraw Address</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-card)]">
              {txs
                .filter((t) => t.type === "withdraw")
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((tx) => {
                  const u = users.find((u) => u.id === tx.userId);
                  const address = tx.address || tx.description || "-";
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-[var(--color-bg-base)] transition-colors"
                    >
                      <td className="py-4 text-text-muted text-xs">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="py-4 font-medium">
                        {u?.username || tx.userId.substring(0, 6)}
                      </td>
                      <td className="py-4 text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="max-w-[200px] truncate"
                            title={address}
                          >
                            {address}
                          </span>
                          {address !== "-" && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(address);
                                alert("Address copied!");
                              }}
                              className="text-text-muted hover:text-white p-1"
                            >
                              <Copy size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 font-bold text-brand-gold">
                        {formatXRP(tx.amount)}
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                            tx.status === "pending"
                              ? "bg-yellow-500/10 text-yellow-500"
                              : tx.status === "completed"
                                ? "bg-green-500/10 text-green-500"
                                : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-4 text-right space-x-2">
                        {tx.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApproveWithdraw(tx)}
                              className="p-1.5 px-3 text-xs bg-green-500/10 text-green-500 font-bold hover:bg-green-500/20 rounded-lg"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectWithdraw(tx)}
                              className="p-1.5 px-3 text-xs bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 rounded-lg"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              {txs.filter((t) => t.type === "withdraw").length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">
                    No withdrawal requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-xl font-bold mb-6">System Settings</h2>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="text-sm text-text-muted mb-1 block">
                  Customer Support (Telegram Link)
                </label>
                <input
                  type="text"
                  value={supportLink}
                  onChange={(e) => setSupportLink(e.target.value)}
                  className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white"
                />
              </div>

              <div className="pt-4 border-t border-[var(--color-border-card)]">
                <h3 className="font-bold mb-3 text-brand-gold">
                  Stake Settings
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-text-muted mb-1 block">
                      Monthly Interest Rate (%)
                    </label>
                    <input
                      type="number"
                      value={stakeSettings.interestRate}
                      onChange={(e) =>
                        setStakeSettings((prev) => ({
                          ...prev,
                          interestRate: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-2 px-3 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-text-muted mb-1 block">
                      Minimum Stake (XRP)
                    </label>
                    <input
                      type="number"
                      value={stakeSettings.minStake}
                      onChange={(e) =>
                        setStakeSettings((prev) => ({
                          ...prev,
                          minStake: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-2 px-3 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-text-muted mb-1 block">
                      Maximum Stake (XRP)
                    </label>
                    <input
                      type="number"
                      value={stakeSettings.maxStake}
                      onChange={(e) =>
                        setStakeSettings((prev) => ({
                          ...prev,
                          maxStake: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-2 px-3 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--color-border-card)]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-brand-gold">
                    Referral Auto-Reward System
                  </h3>
                  <button
                    onClick={() =>
                      setReferralSystemEnabled(!referralSystemEnabled)
                    }
                    className={`text-xs px-3 py-1 rounded-lg font-bold ${referralSystemEnabled ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}
                  >
                    {referralSystemEnabled ? "Enabled" : "Disabled"}
                  </button>
                </div>

                {referralSystemEnabled && (
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="text-sm text-text-muted mb-1 block">
                        Level 1 Commission (%)
                      </label>
                      <input
                        type="number"
                        value={referralLevel1Rate}
                        onChange={(e) =>
                          setReferralLevel1Rate(parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-2 px-3 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-text-muted mb-1 block">
                        Level 2 Commission (%)
                      </label>
                      <input
                        type="number"
                        value={referralLevel2Rate}
                        onChange={(e) =>
                          setReferralLevel2Rate(parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-2 px-3 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-text-muted mb-1 block">
                        Level 3 Commission (%)
                      </label>
                      <input
                        type="number"
                        value={referralLevel3Rate}
                        onChange={(e) =>
                          setReferralLevel3Rate(parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-2 px-3 text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-brand-gold">
                    Home Update News Billboard
                  </h3>
                  <button
                    onClick={() => setBillboardEnabled(!billboardEnabled)}
                    className={`text-xs px-3 py-1 rounded-lg font-bold ${billboardEnabled ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}
                  >
                    {billboardEnabled ? "Visible" : "Hidden"}
                  </button>
                </div>
                <textarea
                  value={billboardText}
                  onChange={(e) => setBillboardText(e.target.value)}
                  placeholder="Enter update news or messages to show on the Home page"
                  className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white resize-none h-24 mb-4"
                />

                <h3 className="font-bold text-brand-primary mb-2">
                  Referral Bonus Notice (Text)
                </h3>
                <textarea
                  value={referralBonusText}
                  onChange={(e) => setReferralBonusText(e.target.value)}
                  placeholder="Enter referral bonus text (e.g. 50 active refs = 100 XRP)"
                  className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white resize-none h-28 mb-4"
                />

                <h3 className="font-bold text-green-500 mb-2">
                  Deposit Bonus Content
                </h3>
                <textarea
                  value={depositBonusText}
                  onChange={(e) => setDepositBonusText(e.target.value)}
                  placeholder="Enter deposit bonus text (e.g. Deposit 100 XRP = 10% bonus)"
                  className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white resize-none h-28 mb-4"
                />

                <h3 className="font-bold text-[#FF007A] mb-2">
                  Daily Check-in Rewards (Day 1 to 7)
                </h3>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mb-4">
                  {dailyRewards.map((reward, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <span className="text-xs text-text-muted">Day {idx + 1}</span>
                      <input
                        type="number"
                        value={reward}
                        onChange={(e) => {
                          const newRewards = [...dailyRewards];
                          newRewards[idx] = Number(e.target.value);
                          setDailyRewards(newRewards);
                        }}
                        className="bg-[var(--color-bg-base)] w-full text-center py-2 rounded-lg border border-[var(--color-border-card)]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  store.updateSystemSettings({
                    supportLink,
                    stakeSettings,
                    banners,
                    billboardText,
                    billboardEnabled,
                    referralBonusText,
                    depositBonusText,
                    referralSystemEnabled,
                    referralLevel1Rate,
                    referralLevel2Rate,
                    referralLevel3Rate,
                    dailyRewards,
                    gameCrashWinRate,
                    gameRocketWinRate,
                    gameCoinWinRate,
                    gameDiceWinRate,
                    gameSlotsWinRate,
                    gameFishWinRate,
                    gameCoinFlipEnabled,
                    gameDiceRollEnabled,
                    gameCrashEnabled,
                    gameSlotsEnabled,
                    gameFishEnabled,
                    gameWheelEnabled,
                    gameMinesEnabled,
                    gamePlinkoEnabled,
                    gameTowerEnabled,
                  });
                  alert("Settings saved!");
                }}
                className="px-6 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/80 transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-xl font-bold mb-6">VIP Level Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vipLevels.map((vp) => (
                <div
                  key={vp.level}
                  className="bg-[var(--color-bg-base)] p-4 rounded-xl border border-[var(--color-border-card)]"
                >
                  <div className="font-bold mb-2">{vp.name}</div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-text-muted">
                        Price (XRP)
                      </label>
                      <input
                        type="number"
                        value={vp.price}
                        onChange={(e) => {
                          const newPrice = Number(e.target.value);
                          const updated = vipLevels.map((v) =>
                            v.level === vp.level
                              ? { ...v, price: newPrice }
                              : v,
                          );
                          setVipLevels(updated);
                        }}
                        className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded py-2 px-3 text-white mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted">
                        Daily Income (XRP)
                      </label>
                      <input
                        type="number"
                        value={vp.dailyIncome}
                        onChange={(e) => {
                          const newIncome = Number(e.target.value);
                          const updated = vipLevels.map((v) =>
                            v.level === vp.level
                              ? { ...v, dailyIncome: newIncome }
                              : v,
                          );
                          setVipLevels(updated);
                        }}
                        className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded py-2 px-3 text-white mt-1"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      store.updateVipLevel(vp.level, {
                        price: vp.price,
                        dailyIncome: vp.dailyIncome,
                      });
                      alert(`${vp.name} settings saved!`);
                    }}
                    className="w-full mt-4 py-2 bg-brand-gold/10 text-brand-gold font-bold rounded-lg hover:bg-brand-gold/20"
                  >
                    Save {vp.name}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-xl font-bold mb-6 flex items-center justify-between">
              Payment Methods (Recharge)
              <button
                onClick={() => {
                  setIsAddingMethod(true);
                  setMethodForm({ name: "", network: "TRC20", address: "" });
                }}
                className="bg-brand-primary text-white font-bold py-2 px-4 rounded-xl text-sm gap-2 inline-flex items-center"
              >
                <Plus size={16} /> Add Method
              </button>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map((m) => (
                <div
                  key={m.id}
                  className="bg-[var(--color-bg-base)] p-4 rounded-xl border border-[var(--color-border-card)]"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-bold">{m.name}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditMethod(m)}
                        className="p-2 text-brand-gold hover:bg-brand-gold/10 rounded-lg"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteMethod(m.id)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-text-muted">
                      Network: <span className="text-white">{m.network}</span>
                    </div>
                    <div className="text-xs text-text-muted break-all">
                      Address:{" "}
                      <span className="text-white font-mono">{m.address}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "games" && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-xl font-bold mb-6 text-brand-primary">Game Control & Win Rates</h2>
            <div className="space-y-6">
              
              <div className="bg-[var(--color-bg-base)] p-4 rounded-xl border border-[var(--color-border-card)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Crazy Worm</h3>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={gameCrashEnabled} onChange={(e) => setGameCrashEnabled(e.target.checked)} className="rounded text-brand-primary bg-[var(--color-bg-base)] border-[var(--color-border-card)] focus:ring-brand-primary" />
                    <span className="text-sm">Enabled</span>
                  </label>
                </div>
                <label className="text-sm text-text-muted mb-1 block">Player Win Chance (%) - Lower means more house profit</label>
                <input type="number" value={gameCrashWinRate} max={100} min={0} onChange={(e) => setGameCrashWinRate(parseFloat(e.target.value) || 0)} className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-xl py-2 px-3 text-white" />
              </div>

              <div className="bg-[var(--color-bg-base)] p-4 rounded-xl border border-[var(--color-border-card)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Crash Rocket</h3>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={gameCrashEnabled} onChange={(e) => setGameCrashEnabled(e.target.checked)} className="rounded text-brand-primary bg-[var(--color-bg-base)] border-[var(--color-border-card)] focus:ring-brand-primary" />
                    <span className="text-sm">Enabled (Shared with Crazy Worm)</span>
                  </label>
                </div>
                <label className="text-sm text-text-muted mb-1 block">Player Win Chance (%)</label>
                <input type="number" value={gameRocketWinRate} max={100} min={0} onChange={(e) => setGameRocketWinRate(parseFloat(e.target.value) || 0)} className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-xl py-2 px-3 text-white" />
              </div>

              <div className="bg-[var(--color-bg-base)] p-4 rounded-xl border border-[var(--color-border-card)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Coin Flip</h3>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={gameCoinFlipEnabled} onChange={(e) => setGameCoinFlipEnabled(e.target.checked)} className="rounded text-brand-primary bg-[var(--color-bg-base)] border-[var(--color-border-card)] focus:ring-brand-primary" />
                    <span className="text-sm">Enabled</span>
                  </label>
                </div>
                <label className="text-sm text-text-muted mb-1 block">Player Win Chance (%)</label>
                <input type="number" value={gameCoinWinRate} max={100} min={0} onChange={(e) => setGameCoinWinRate(parseFloat(e.target.value) || 0)} className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-xl py-2 px-3 text-white" />
              </div>

              <div className="bg-[var(--color-bg-base)] p-4 rounded-xl border border-[var(--color-border-card)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Dice Roll</h3>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={gameDiceRollEnabled} onChange={(e) => setGameDiceRollEnabled(e.target.checked)} className="rounded text-brand-primary bg-[var(--color-bg-base)] border-[var(--color-border-card)] focus:ring-brand-primary" />
                    <span className="text-sm">Enabled</span>
                  </label>
                </div>
                <label className="text-sm text-text-muted mb-1 block">Player Win Chance (%)</label>
                <input type="number" value={gameDiceWinRate} max={100} min={0} onChange={(e) => setGameDiceWinRate(parseFloat(e.target.value) || 0)} className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-xl py-2 px-3 text-white" />
              </div>

              <div className="bg-[var(--color-bg-base)] p-4 rounded-xl border border-[var(--color-border-card)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Slots</h3>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={gameSlotsEnabled} onChange={(e) => setGameSlotsEnabled(e.target.checked)} className="rounded text-brand-primary bg-[var(--color-bg-base)] border-[var(--color-border-card)] focus:ring-brand-primary" />
                    <span className="text-sm">Enabled</span>
                  </label>
                </div>
                <label className="text-sm text-text-muted mb-1 block">Player Win Chance (%)</label>
                <input type="number" value={gameSlotsWinRate} max={100} min={0} onChange={(e) => setGameSlotsWinRate(parseFloat(e.target.value) || 0)} className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-xl py-2 px-3 text-white" />
              </div>

              <div className="bg-[var(--color-bg-base)] p-4 rounded-xl border border-[var(--color-border-card)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Fish Hunter</h3>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={gameFishEnabled} onChange={(e) => setGameFishEnabled(e.target.checked)} className="rounded text-brand-primary bg-[var(--color-bg-base)] border-[var(--color-border-card)] focus:ring-brand-primary" />
                    <span className="text-sm">Enabled</span>
                  </label>
                </div>
                <label className="text-sm text-text-muted mb-1 block">Player Win Chance (%)</label>
                <input type="number" value={gameFishWinRate} max={100} min={0} onChange={(e) => setGameFishWinRate(parseFloat(e.target.value) || 0)} className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-xl py-2 px-3 text-white" />
              </div>

              <div className="bg-[var(--color-bg-base)] p-4 rounded-xl border border-[var(--color-border-card)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Spin Wheel</h3>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={gameWheelEnabled} onChange={(e) => setGameWheelEnabled(e.target.checked)} className="rounded text-brand-primary bg-[var(--color-bg-base)] border-[var(--color-border-card)] focus:ring-brand-primary" />
                    <span className="text-sm">Enabled</span>
                  </label>
                </div>
              </div>

              <div className="bg-[var(--color-bg-base)] p-4 rounded-xl border border-[var(--color-border-card)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Mines</h3>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={gameMinesEnabled} onChange={(e) => setGameMinesEnabled(e.target.checked)} className="rounded text-brand-primary bg-[var(--color-bg-base)] border-[var(--color-border-card)] focus:ring-brand-primary" />
                    <span className="text-sm">Enabled</span>
                  </label>
                </div>
              </div>

              <div className="bg-[var(--color-bg-base)] p-4 rounded-xl border border-[var(--color-border-card)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Plinko</h3>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={gamePlinkoEnabled} onChange={(e) => setGamePlinkoEnabled(e.target.checked)} className="rounded text-brand-primary bg-[var(--color-bg-base)] border-[var(--color-border-card)] focus:ring-brand-primary" />
                    <span className="text-sm">Enabled</span>
                  </label>
                </div>
              </div>

              <div className="bg-[var(--color-bg-base)] p-4 rounded-xl border border-[var(--color-border-card)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Tower</h3>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={gameTowerEnabled} onChange={(e) => setGameTowerEnabled(e.target.checked)} className="rounded text-brand-primary bg-[var(--color-bg-base)] border-[var(--color-border-card)] focus:ring-brand-primary" />
                    <span className="text-sm">Enabled</span>
                  </label>
                </div>
              </div>
              
              <button
                onClick={() => {
                  store.updateSystemSettings({
                    gameCrashWinRate,
                    gameRocketWinRate,
                    gameCoinWinRate,
                    gameDiceWinRate,
                    gameSlotsWinRate,
                    gameFishWinRate,
                    gameCoinFlipEnabled,
                    gameDiceRollEnabled,
                    gameCrashEnabled,
                    gameSlotsEnabled,
                    gameFishEnabled,
                    gameWheelEnabled,
                    gameMinesEnabled,
                    gamePlinkoEnabled,
                    gameTowerEnabled,
                  });
                  alert("Game settings saved!");
                }}
                className="px-6 py-3 w-full bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/80 transition-colors"
              >
                Save Game Settings
              </button>

            </div>
          </div>
        </div>
      )}

      {activeTab === "overview" && (
        <div className="space-y-6">
          {(() => {
            const now = new Date();
            const todayStart = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
            ).getTime();
            const yesterdayStart = todayStart - 86400000;

            const todayDepCount = txs.filter(
              (t) =>
                t.type === "deposit" &&
                t.status === "completed" &&
                t.timestamp >= todayStart,
            );
            const yestDepCount = txs.filter(
              (t) =>
                t.type === "deposit" &&
                t.status === "completed" &&
                t.timestamp >= yesterdayStart &&
                t.timestamp < todayStart,
            );
            const todayWithCount = txs.filter(
              (t) =>
                t.type === "withdraw" &&
                t.status === "completed" &&
                t.timestamp >= todayStart,
            );
            const yestWithCount = txs.filter(
              (t) =>
                t.type === "withdraw" &&
                t.status === "completed" &&
                t.timestamp >= yesterdayStart &&
                t.timestamp < todayStart,
            );

            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard
                    icon={<Users />}
                    label="Total Users"
                    value={users.length.toString()}
                    color="text-blue-500"
                    bg="bg-blue-500/10"
                  />
                  <StatCard
                    icon={<CreditCard />}
                    label="Total Deposits"
                    value={formatXRP(
                      txs
                        .filter(
                          (t) =>
                            t.type === "deposit" && t.status === "completed",
                        )
                        .reduce((acc, tx) => acc + tx.amount, 0),
                    )}
                    color="text-green-500"
                    bg="bg-green-500/10"
                  />
                  <StatCard
                    icon={<Activity />}
                    label="Pending Deposits"
                    value={pendingDeposits.length.toString()}
                    color="text-brand-primary"
                    bg="bg-brand-primary/10"
                  />
                  <StatCard
                    icon={<Activity />}
                    label="Pending Withdraws"
                    value={pendingWithdraws.length.toString()}
                    color="text-red-500"
                    bg="bg-red-500/10"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard
                    icon={<ArrowDown />}
                    label="Deposits (Today)"
                    value={`${todayDepCount.length} Users`}
                    subValue={formatXRP(
                      todayDepCount.reduce((a, b) => a + b.amount, 0),
                    )}
                    color="text-green-400"
                    bg="bg-green-400/10"
                  />
                  <StatCard
                    icon={<ArrowDown />}
                    label="Deposits (Yesterday)"
                    value={`${yestDepCount.length} Users`}
                    subValue={formatXRP(
                      yestDepCount.reduce((a, b) => a + b.amount, 0),
                    )}
                    color="text-gray-400"
                    bg="bg-gray-400/10"
                  />
                  <StatCard
                    icon={<ArrowUp />}
                    label="Withdrawals (Today)"
                    value={`${todayWithCount.length} Users`}
                    subValue={formatXRP(
                      todayWithCount.reduce((a, b) => a + b.amount, 0),
                    )}
                    color="text-red-400"
                    bg="bg-red-400/10"
                  />
                  <StatCard
                    icon={<ArrowUp />}
                    label="Withdrawals (Yesterday)"
                    value={`${yestWithCount.length} Users`}
                    subValue={formatXRP(
                      yestWithCount.reduce((a, b) => a + b.amount, 0),
                    )}
                    color="text-gray-400"
                    bg="bg-gray-400/10"
                  />
                </div>
              </>
            );
          })()}

          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="text-brand-gold" /> System Notices
              </div>
              <button
                onClick={() => {
                  const text = prompt("Enter new notice text:");
                  if (text) {
                    store.addNotice(text);
                    refreshData();
                  }
                }}
                className="bg-brand-primary text-white px-3 py-1.5 rounded-lg text-sm font-bold"
              >
                + Add Notice
              </button>
            </h2>
            <div className="space-y-3">
              {store.getState().notices.map((n) => (
                <div
                  key={n.id}
                  className="flex justify-between items-center p-3 bg-[var(--color-bg-base)] rounded-xl border border-[var(--color-border-card)] gap-4"
                >
                  <span className="text-sm flex-1">{n.text}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        store.updateNotice(n.id, { isActive: !n.isActive });
                        refreshData();
                      }}
                      className={`text-xs px-2 py-1 rounded-md ${n.isActive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}
                    >
                      {n.isActive ? "Active" : "Inactive"}
                    </button>
                    <button
                      onClick={() => {
                        store.deleteNotice(n.id);
                        refreshData();
                      }}
                      className="p-1 px-2 text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel p-6 rounded-3xl mt-6">
            <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Newspaper className="text-brand-gold" /> News Management
              </div>
              <button
                onClick={() => {
                  const title = prompt("Enter news title:");
                  if (!title) return;
                  const category = prompt("Enter category (e.g., Crypto News, Platform Updates, Market Insights):") || "Platform Updates";
                  const type = prompt("Enter type (announcement, news, insight):") || "announcement";
                  const content = prompt("Enter news content:");
                  if (title && content) {
                    store.addNews({ title, category, type, content });
                    refreshData();
                  }
                }}
                className="bg-brand-primary text-white px-3 py-1.5 rounded-lg text-sm font-bold"
              >
                + Add News
              </button>
            </h2>
            <div className="space-y-3">
              {store.getState().news?.map((n: any) => (
                <div
                  key={n.id}
                  className="flex justify-between items-center p-3 bg-[var(--color-bg-base)] rounded-xl border border-[var(--color-border-card)] gap-4"
                >
                  <div className="flex-1">
                    <div className="font-bold mb-1">{n.title}</div>
                    <div className="text-xs text-text-muted">{n.category} • {n.type}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        store.deleteNews(n.id);
                        refreshData();
                      }}
                      className="p-1 px-2 text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "kyc" && (
        <div className="glass-panel p-6 rounded-3xl overflow-x-auto">
          <h2 className="text-xl font-bold mb-6">KYC Verifications</h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-text-muted border-b border-[var(--color-border-card)]">
                <th className="pb-3 font-medium">User ID</th>
                <th className="pb-3 font-medium">ID Number</th>
                <th className="pb-3 font-medium">Photo ID</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-card)]">
              {users.filter(u => u.kycStatus === "pending").map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-[var(--color-bg-base)] transition-colors"
                >
                  <td className="py-4 font-medium">
                    {u.username || u.id.substring(0, 6)}
                  </td>
                  <td className="py-4 font-mono text-xs">{u.kycIdNumber || "-"}</td>
                  <td className="py-4">
                    {u.kycPhoto ? (
                      <button onClick={() => setViewingKycPhoto(u.kycPhoto!)} className="text-brand-primary underline text-xs">
                        View Photo
                      </button>
                    ) : "-"}
                  </td>
                  <td className="py-4">
                    <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-yellow-500/10 text-yellow-500">
                      Pending
                    </span>
                  </td>
                  <td className="py-4 text-right space-x-2">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleApproveKyc(u.id)}
                        className="p-1.5 px-3 text-xs bg-green-500/10 text-green-500 font-bold hover:bg-green-500/20 rounded-lg"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectKyc(u.id)}
                        className="p-1.5 px-3 text-xs bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 rounded-lg"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.filter(u => u.kycStatus === "pending").length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted">
                    No pending KYC requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "users" && (
        <div className="glass-panel p-6 rounded-3xl overflow-x-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold">User Management</h2>
            <input
              type="text"
              placeholder="Search by username, phone..."
              className="bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-primary min-w-[250px]"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
            />
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-text-muted border-b border-[var(--color-border-card)]">
                <th className="pb-3 font-medium">Username</th>
                <th className="pb-3 font-medium">Phone</th>
                <th className="pb-3 font-medium">Balance</th>
                <th className="pb-3 font-medium">Referred By</th>
                <th className="pb-3 font-medium">Team (L1/L2/L3)</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-card)]">
              {[...users]
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                .filter(
                  (u) =>
                    u.username
                      ?.toLowerCase()
                      .includes(userSearchQuery.toLowerCase()) ||
                    u.phone?.includes(userSearchQuery),
                )
                .map((u) => {
                  const userUn = (u.username || "").trim().toLowerCase();
                  const uL1 = users.filter((x) => {
                    const xRef = (x.referrerId || "").trim().toLowerCase();
                    if (!userUn) return false;
                    return (
                      xRef === userUn ||
                      (u.role === "admin" && xRef === "admin")
                    );
                  });
                  const uL2 = users.filter((x) => {
                    const xRef = (x.referrerId || "").trim().toLowerCase();
                    return uL1.some(
                      (l1) =>
                        l1.username &&
                        l1.username.trim().toLowerCase() === xRef,
                    );
                  });
                  const uL3 = users.filter((x) => {
                    const xRef = (x.referrerId || "").trim().toLowerCase();
                    return uL2.some(
                      (l2) =>
                        l2.username &&
                        l2.username.trim().toLowerCase() === xRef,
                    );
                  });

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-[var(--color-bg-base)] transition-colors"
                    >
                      <td className="py-4 font-medium flex items-center gap-2">
                        {u.username}
                        {u.role === "admin" && (
                          <span className="px-2 py-0.5 text-[10px] bg-red-500/20 text-red-500 rounded font-bold uppercase">
                            Admin
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-text-muted">{u.phone}</td>
                      <td className="py-4 text-brand-gold font-bold">
                        {formatXRP(u.balance)}
                      </td>
                      <td className="py-4 text-text-muted">
                        {u.referrerId ? u.referrerId : "-"}
                      </td>
                      <td className="py-4 font-mono text-xs text-text-muted">
                        {uL1.length} / {uL2.length} / {uL3.length}
                      </td>
                      <td className="py-4">
                        {u.isBlocked ? (
                          <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded text-xs font-bold">
                            Blocked
                          </span>
                        ) : (
                          <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-bold">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => openUserHistory(u.id)}
                          className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg inline-flex items-center gap-1"
                        >
                          <Activity size={16} />{" "}
                          <span className="hidden sm:inline">History</span>
                        </button>
                        <button
                          onClick={() => openEditUser(u)}
                          className="p-2 text-brand-gold hover:bg-brand-gold/10 rounded-lg inline-flex items-center gap-1"
                        >
                          <Edit size={16} />{" "}
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        {u.isBlocked ? (
                          <button
                            onClick={() => handleBlockUser(u.id, false)}
                            className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg inline-flex items-center gap-1"
                            title="Unblock"
                          >
                            <ShieldCheck size={16} />{" "}
                            <span className="hidden sm:inline">Unblock</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBlockUser(u.id, true)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg inline-flex items-center gap-1"
                            title="Block"
                          >
                            <ShieldAlert size={16} />{" "}
                            <span className="hidden sm:inline">Block</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg inline-flex items-center gap-1"
                          title="Delete User"
                        >
                          <Trash size={16} />{" "}
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-text-muted">
                    No users registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "products" && (
        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Box /> Product Management
            </h2>
            <button
              onClick={openAddProduct}
              className="bg-brand-primary text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-brand-primary/80 transition-colors"
            >
              <Plus size={18} /> Add Product
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-2xl overflow-hidden p-4 flex gap-4"
              >
                <img
                  src={p.img}
                  alt={p.name}
                  className="w-20 h-20 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-bold line-clamp-1 text-sm">{p.name}</h3>
                  <div className="text-xs text-text-muted mb-2">{p.hash}</div>
                  <div className="font-bold text-brand-gold text-sm">
                    {formatXRP(p.price)}
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <button
                      onClick={() => openEditProduct(p)}
                      className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "nfts" && (
        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Box /> NFT Management
            </h2>
            <button
              onClick={openAddNFT}
              className="bg-brand-primary text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-brand-primary/80 transition-colors"
            >
              <Plus size={18} /> Add NFT
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.map((nft) => (
              <div
                key={nft.id}
                className="bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-2xl overflow-hidden p-4 flex gap-4"
              >
                <img
                  src={nft.imageUrl}
                  alt={nft.title}
                  className="w-20 h-20 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-bold line-clamp-1 text-sm">{nft.title}</h3>
                  <div className="text-xs text-text-muted mb-2 line-clamp-1">{nft.description}</div>
                  <div className="font-bold text-brand-gold text-sm">
                    {formatXRP(nft.price || 0)}
                  </div>
                  <div className="text-xs text-text-muted mt-1">Status: {nft.status}</div>
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <button
                      onClick={() => openEditNFT(nft)}
                      className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteNFT(nft.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {(isAddingProduct || editingProduct) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border-card)] p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">
                  {isAddingProduct ? "Add Product" : "Edit Product"}
                </h3>
                <button
                  onClick={() => {
                    setIsAddingProduct(false);
                    setEditingProduct(null);
                  }}
                  className="p-2 bg-[var(--color-bg-base)] rounded-full text-text-muted hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-text-muted mb-1 block">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={prodForm.name}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, name: e.target.value })
                    }
                    className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-muted mb-1 block">
                    Hash Rate (e.g., 100 TH/s)
                  </label>
                  <input
                    type="text"
                    value={prodForm.hash}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, hash: e.target.value })
                    }
                    className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-muted mb-1 block">
                    Price (XRP)
                  </label>
                  <input
                    type="number"
                    value={prodForm.price}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, price: e.target.value })
                    }
                    className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-muted mb-1 block">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={prodForm.img}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, img: e.target.value })
                    }
                    className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white"
                  />
                </div>
                <button
                  onClick={handleSaveProduct}
                  className="w-full py-3 mt-4 bg-brand-primary text-white font-bold rounded-xl"
                >
                  {isAddingProduct ? "Create Product" : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {(isAddingNFT || editingNFT) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border-card)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">
                  {isAddingNFT ? "Add NFT" : "Edit NFT"}
                </h3>
                <button
                  onClick={() => {
                    setIsAddingNFT(false);
                    setEditingNFT(null);
                  }}
                  className="p-2 bg-[var(--color-bg-base)] rounded-full text-text-muted hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-text-muted mb-1 block">Title</label>
                  <input
                    type="text"
                    value={nftForm.title}
                    onChange={(e) => setNftForm({ ...nftForm, title: e.target.value })}
                    className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-muted mb-1 block">Description</label>
                  <input
                    type="text"
                    value={nftForm.description}
                    onChange={(e) => setNftForm({ ...nftForm, description: e.target.value })}
                    className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-muted mb-1 block">Price (XRP)</label>
                  <input
                    type="number"
                    value={nftForm.price}
                    onChange={(e) => setNftForm({ ...nftForm, price: e.target.value })}
                    className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-muted mb-1 block">Image URL</label>
                  <input
                    type="text"
                    value={nftForm.imageUrl}
                    onChange={(e) => setNftForm({ ...nftForm, imageUrl: e.target.value })}
                    className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-muted mb-1 block">Status</label>
                  <select
                    value={nftForm.status}
                    onChange={(e) => setNftForm({ ...nftForm, status: e.target.value })}
                    className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white"
                  >
                    <option value="sale">For Sale</option>
                    <option value="auction">Auction</option>
                    <option value="owned">Owned (Not listed)</option>
                  </select>
                </div>
                <button
                  onClick={handleSaveNFT}
                  className="w-full py-3 mt-4 bg-brand-primary text-white font-bold rounded-xl"
                >
                  {isAddingNFT ? "Create NFT" : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border-card)] p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">
                  Edit User ({editingUser.username})
                </h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-2 bg-[var(--color-bg-base)] rounded-full text-text-muted hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-text-muted mb-1 block">
                    Balance (XRP)
                  </label>
                  <input
                    type="number"
                    value={userForm.balance}
                    onChange={(e) =>
                      setUserForm({ ...userForm, balance: e.target.value })
                    }
                    className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-muted mb-1 block">
                    Password
                  </label>
                  <input
                    type="text"
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm({ ...userForm, password: e.target.value })
                    }
                    className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Leave as is unless changing it.
                  </p>
                </div>
                <div>
                  <label className="text-sm text-text-muted mb-1 block">
                    VIP Level (0-9)
                  </label>
                  <input
                    type="number"
                    value={userForm.vipLevel}
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,
                        vipLevel: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white"
                  />
                </div>
                <button
                  onClick={handleSaveUser}
                  className="w-full py-3 mt-4 bg-brand-primary text-white font-bold rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {viewedUserHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border-card)] p-6 shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-xl font-bold">Mining History</h3>
                <button
                  onClick={() => setViewedUserHistory(null)}
                  className="p-2 bg-[var(--color-bg-base)] rounded-full text-text-muted hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4 overflow-y-auto shrink-1 max-h-[60vh]">
                {viewedUserHistory.length === 0 ? (
                  <div className="text-center py-10 text-text-muted">
                    No mining history found
                  </div>
                ) : (
                  viewedUserHistory.map((tx) => (
                    <div
                      key={tx.id}
                      className="bg-[var(--color-bg-base)] border border-[var(--color-border-card)] p-4 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-sm text-green-500">
                          {tx.description}
                        </div>
                        <div className="text-xs text-text-muted mt-1">
                          {new Date(tx.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="font-bold text-brand-gold">
                        +{formatXRP(tx.amount)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {(isAddingMethod || editingMethod) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border-card)] p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">
                  {isAddingMethod
                    ? "Add Payment Method"
                    : "Edit Payment Method"}
                </h3>
                <button
                  onClick={() => {
                    setIsAddingMethod(false);
                    setEditingMethod(null);
                  }}
                  className="p-2 bg-[var(--color-bg-base)] rounded-full text-text-muted hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-text-muted mb-1 block">
                    Name (e.g. TRC20 Wallet / Main Network)
                  </label>
                  <input
                    type="text"
                    value={methodForm.name}
                    onChange={(e) =>
                      setMethodForm({ ...methodForm, name: e.target.value })
                    }
                    className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-muted mb-1 block">
                    Network (e.g. TRC20, ERC20)
                  </label>
                  <input
                    type="text"
                    value={methodForm.network}
                    onChange={(e) =>
                      setMethodForm({ ...methodForm, network: e.target.value })
                    }
                    className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-muted mb-1 block">
                    Deposit Address
                  </label>
                  <input
                    type="text"
                    value={methodForm.address}
                    onChange={(e) =>
                      setMethodForm({ ...methodForm, address: e.target.value })
                    }
                    className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white font-mono"
                  />
                </div>
                <button
                  onClick={handleSaveMethod}
                  className="w-full py-3 mt-4 bg-brand-primary text-white font-bold rounded-xl"
                >
                  {isAddingMethod ? "Create Method" : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {viewingKycPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-2xl bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border-card)] p-6 shadow-2xl flex flex-col max-h-[90vh] relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">KYC Photo</h2>
                <button
                  type="button"
                  onClick={() => setViewingKycPhoto(null)}
                  className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-full transition-colors absolute top-4 right-4"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-auto rounded-xl flex items-center justify-center bg-black/50 min-h-[300px]">
                <img src={viewingKycPhoto} alt="KYC" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, label, value, subValue, color, bg }: any) {
  return (
    <div className="glass-panel p-6 rounded-3xl flex items-center justify-between">
      <div>
        <div className="text-sm text-text-muted mb-1">{label}</div>
        <div className={`text-3xl font-bold ${color}`}>{value}</div>
        {subValue && (
          <div className={`text-sm mt-1 opacity-80 ${color}`}>{subValue}</div>
        )}
      </div>
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bg} ${color}`}
      >
        {icon}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
        active
          ? "bg-brand-primary text-white shadow-md"
          : "text-text-muted hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
