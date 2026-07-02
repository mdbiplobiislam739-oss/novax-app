import { AppState, Notice, Transaction, User, VIPLevel, Product, Order, PaymentMethod, BetRecord } from '../types';
import { generateId } from './utils';
import { db, auth } from './firebase';
import { doc, getDoc, getDocs, setDoc, onSnapshot, collection, query, where, deleteDoc } from 'firebase/firestore';

const STORE_KEY = 'trx_hub_db_v2';
let unsubscribers: (() => void)[] = [];

// Fallback initial data (only used if Firebase doesn't load)
export const VIP_LEVELS: VIPLevel[] = [
  { level: 0, name: 'Free User', price: 0, dailyIncome: 0.5, validityDays: 365, maxTasks: 1 },
  { level: 1, name: 'VIP 1', price: 30, dailyIncome: 5, validityDays: 365, maxTasks: 5 },
  { level: 2, name: 'VIP 2', price: 300, dailyIncome: 18, validityDays: 365, maxTasks: 10 },
  { level: 3, name: 'VIP 3', price: 1000, dailyIncome: 65, validityDays: 365, maxTasks: 15 },
  { level: 4, name: 'VIP 4', price: 3000, dailyIncome: 210, validityDays: 365, maxTasks: 20 },
  { level: 5, name: 'VIP 5', price: 10000, dailyIncome: 800, validityDays: 365, maxTasks: 30 },
  { level: 6, name: 'VIP 6', price: 25000, dailyIncome: 2250, validityDays: 365, maxTasks: 40 },
  { level: 7, name: 'VIP 7', price: 50000, dailyIncome: 5000, validityDays: 365, maxTasks: 50 },
  { level: 8, name: 'VIP 8', price: 100000, dailyIncome: 12000, validityDays: 365, maxTasks: 60 },
];

const initialNotices: Notice[] = [
  { id: '1', text: 'Welcome to NovaX! Join our Telegram for daily signals.', isActive: true, timestamp: Date.now() },
  { id: '2', text: 'VIP 3 upgrade now gives 10% extra daily bonus until the end of the month!', isActive: true, timestamp: Date.now() },
];

const initialProducts: Product[] = [
  { id: 'prod-v3-1', name: 'Luxury Jeans #1', hash: 'Size 37', price: 92, img: 'https://loremflickr.com/300/300/jeans?lock=1' },
  { id: 'prod-v3-2', name: 'Luxury Dress #2', hash: 'Size 38', price: 27, img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-3', name: 'Luxury Handbag #3', hash: 'Size 39', price: 135, img: 'https://loremflickr.com/300/300/handbag?lock=3' },
  { id: 'prod-v3-4', name: 'Luxury T-Shirt #4', hash: 'Size 40', price: 32, img: 'https://loremflickr.com/300/300/tshirt?lock=4' },
  { id: 'prod-v3-5', name: 'Luxury Jacket #5', hash: 'Size 41', price: 146, img: 'https://loremflickr.com/300/300/jacket?lock=5' },
  { id: 'prod-v3-6', name: 'Luxury Watch #6', hash: 'Size 42', price: 46, img: 'https://loremflickr.com/300/300/watch?lock=6' },
  { id: 'prod-v3-7', name: 'Luxury Heels #7', hash: 'Size 43', price: 226, img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-8', name: 'Luxury Jewelry #8', hash: 'Size 36', price: 296, img: 'https://loremflickr.com/300/300/jewelry?lock=8' },
  { id: 'prod-v3-9', name: 'Luxury Sunglasses #9', hash: 'Size 37', price: 264, img: 'https://loremflickr.com/300/300/sunglasses?lock=9' },
  { id: 'prod-v3-10', name: 'Luxury Makeup #10', hash: 'Size 38', price: 244, img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-11', name: 'Luxury Perfume #11', hash: 'Size 39', price: 145, img: 'https://loremflickr.com/300/300/perfume?lock=11' },
  { id: 'prod-v3-12', name: 'Luxury Sneakers #12', hash: 'Size 40', price: 38, img: 'https://loremflickr.com/300/300/sneakers?lock=12' },
  { id: 'prod-v3-13', name: 'Luxury Jeans #13', hash: 'Size 41', price: 64, img: 'https://loremflickr.com/300/300/jeans?lock=13' },
  { id: 'prod-v3-14', name: 'Luxury Dress #14', hash: 'Size 42', price: 224, img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-15', name: 'Luxury Handbag #15', hash: 'Size 43', price: 42, img: 'https://loremflickr.com/300/300/handbag?lock=15' },
  { id: 'prod-v3-16', name: 'Luxury T-Shirt #16', hash: 'Size 36', price: 171, img: 'https://loremflickr.com/300/300/tshirt?lock=16' },
  { id: 'prod-v3-17', name: 'Luxury Jacket #17', hash: 'Size 37', price: 252, img: 'https://loremflickr.com/300/300/jacket?lock=17' },
  { id: 'prod-v3-18', name: 'Luxury Watch #18', hash: 'Size 38', price: 256, img: 'https://loremflickr.com/300/300/watch?lock=18' },
  { id: 'prod-v3-19', name: 'Luxury Heels #19', hash: 'Size 39', price: 165, img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-20', name: 'Luxury Jewelry #20', hash: 'Size 40', price: 260, img: 'https://loremflickr.com/300/300/jewelry?lock=20' },
  { id: 'prod-v3-21', name: 'Luxury Sunglasses #21', hash: 'Size 41', price: 233, img: 'https://loremflickr.com/300/300/sunglasses?lock=21' },
  { id: 'prod-v3-22', name: 'Luxury Makeup #22', hash: 'Size 42', price: 223, img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-23', name: 'Luxury Perfume #23', hash: 'Size 43', price: 140, img: 'https://loremflickr.com/300/300/perfume?lock=23' },
  { id: 'prod-v3-24', name: 'Luxury Sneakers #24', hash: 'Size 36', price: 319, img: 'https://loremflickr.com/300/300/sneakers?lock=24' },
  { id: 'prod-v3-25', name: 'Luxury Jeans #25', hash: 'Size 37', price: 82, img: 'https://loremflickr.com/300/300/jeans?lock=25' },
  { id: 'prod-v3-26', name: 'Luxury Dress #26', hash: 'Size 38', price: 267, img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-27', name: 'Luxury Handbag #27', hash: 'Size 39', price: 39, img: 'https://loremflickr.com/300/300/handbag?lock=27' },
  { id: 'prod-v3-28', name: 'Luxury T-Shirt #28', hash: 'Size 40', price: 79, img: 'https://loremflickr.com/300/300/tshirt?lock=28' },
  { id: 'prod-v3-29', name: 'Luxury Jacket #29', hash: 'Size 41', price: 108, img: 'https://loremflickr.com/300/300/jacket?lock=29' },
  { id: 'prod-v3-30', name: 'Luxury Watch #30', hash: 'Size 42', price: 301, img: 'https://loremflickr.com/300/300/watch?lock=30' },
  { id: 'prod-v3-31', name: 'Luxury Heels #31', hash: 'Size 43', price: 217, img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-32', name: 'Luxury Jewelry #32', hash: 'Size 36', price: 318, img: 'https://loremflickr.com/300/300/jewelry?lock=32' },
  { id: 'prod-v3-33', name: 'Luxury Sunglasses #33', hash: 'Size 37', price: 80, img: 'https://loremflickr.com/300/300/sunglasses?lock=33' },
  { id: 'prod-v3-34', name: 'Luxury Makeup #34', hash: 'Size 38', price: 197, img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-35', name: 'Luxury Perfume #35', hash: 'Size 39', price: 40, img: 'https://loremflickr.com/300/300/perfume?lock=35' },
  { id: 'prod-v3-36', name: 'Luxury Sneakers #36', hash: 'Size 40', price: 164, img: 'https://loremflickr.com/300/300/sneakers?lock=36' },
  { id: 'prod-v3-37', name: 'Luxury Jeans #37', hash: 'Size 41', price: 217, img: 'https://loremflickr.com/300/300/jeans?lock=37' },
  { id: 'prod-v3-38', name: 'Luxury Dress #38', hash: 'Size 42', price: 54, img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-39', name: 'Luxury Handbag #39', hash: 'Size 43', price: 228, img: 'https://loremflickr.com/300/300/handbag?lock=39' },
  { id: 'prod-v3-40', name: 'Luxury T-Shirt #40', hash: 'Size 36', price: 173, img: 'https://loremflickr.com/300/300/tshirt?lock=40' },
  { id: 'prod-v3-41', name: 'Luxury Jacket #41', hash: 'Size 37', price: 225, img: 'https://loremflickr.com/300/300/jacket?lock=41' },
  { id: 'prod-v3-42', name: 'Luxury Watch #42', hash: 'Size 38', price: 192, img: 'https://loremflickr.com/300/300/watch?lock=42' },
  { id: 'prod-v3-43', name: 'Luxury Heels #43', hash: 'Size 39', price: 227, img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-44', name: 'Luxury Jewelry #44', hash: 'Size 40', price: 174, img: 'https://loremflickr.com/300/300/jewelry?lock=44' },
  { id: 'prod-v3-45', name: 'Luxury Sunglasses #45', hash: 'Size 41', price: 145, img: 'https://loremflickr.com/300/300/sunglasses?lock=45' },
  { id: 'prod-v3-46', name: 'Luxury Makeup #46', hash: 'Size 42', price: 270, img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-47', name: 'Luxury Perfume #47', hash: 'Size 43', price: 288, img: 'https://loremflickr.com/300/300/perfume?lock=47' },
  { id: 'prod-v3-48', name: 'Luxury Sneakers #48', hash: 'Size 36', price: 97, img: 'https://loremflickr.com/300/300/sneakers?lock=48' },
  { id: 'prod-v3-49', name: 'Luxury Jeans #49', hash: 'Size 37', price: 206, img: 'https://loremflickr.com/300/300/jeans?lock=49' },
  { id: 'prod-v3-50', name: 'Luxury Dress #50', hash: 'Size 38', price: 48, img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-51', name: 'Luxury Handbag #51', hash: 'Size 39', price: 150, img: 'https://loremflickr.com/300/300/handbag?lock=51' },
  { id: 'prod-v3-52', name: 'Luxury T-Shirt #52', hash: 'Size 40', price: 316, img: 'https://loremflickr.com/300/300/tshirt?lock=52' },
  { id: 'prod-v3-53', name: 'Luxury Jacket #53', hash: 'Size 41', price: 177, img: 'https://loremflickr.com/300/300/jacket?lock=53' },
  { id: 'prod-v3-54', name: 'Luxury Watch #54', hash: 'Size 42', price: 105, img: 'https://loremflickr.com/300/300/watch?lock=54' },
  { id: 'prod-v3-55', name: 'Luxury Heels #55', hash: 'Size 43', price: 95, img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-56', name: 'Luxury Jewelry #56', hash: 'Size 36', price: 280, img: 'https://loremflickr.com/300/300/jewelry?lock=56' },
  { id: 'prod-v3-57', name: 'Luxury Sunglasses #57', hash: 'Size 37', price: 266, img: 'https://loremflickr.com/300/300/sunglasses?lock=57' },
  { id: 'prod-v3-58', name: 'Luxury Makeup #58', hash: 'Size 38', price: 303, img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-59', name: 'Luxury Perfume #59', hash: 'Size 39', price: 86, img: 'https://loremflickr.com/300/300/perfume?lock=59' },
  { id: 'prod-v3-60', name: 'Luxury Sneakers #60', hash: 'Size 40', price: 69, img: 'https://loremflickr.com/300/300/sneakers?lock=60' },
  { id: 'prod-v3-61', name: 'Luxury Jeans #61', hash: 'Size 41', price: 124, img: 'https://loremflickr.com/300/300/jeans?lock=61' },
  { id: 'prod-v3-62', name: 'Luxury Dress #62', hash: 'Size 42', price: 41, img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-63', name: 'Luxury Handbag #63', hash: 'Size 43', price: 161, img: 'https://loremflickr.com/300/300/handbag?lock=63' },
  { id: 'prod-v3-64', name: 'Luxury T-Shirt #64', hash: 'Size 36', price: 264, img: 'https://loremflickr.com/300/300/tshirt?lock=64' },
  { id: 'prod-v3-65', name: 'Luxury Jacket #65', hash: 'Size 37', price: 74, img: 'https://loremflickr.com/300/300/jacket?lock=65' },
  { id: 'prod-v3-66', name: 'Luxury Watch #66', hash: 'Size 38', price: 65, img: 'https://loremflickr.com/300/300/watch?lock=66' },
  { id: 'prod-v3-67', name: 'Luxury Heels #67', hash: 'Size 39', price: 249, img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-68', name: 'Luxury Jewelry #68', hash: 'Size 40', price: 100, img: 'https://loremflickr.com/300/300/jewelry?lock=68' },
  { id: 'prod-v3-69', name: 'Luxury Sunglasses #69', hash: 'Size 41', price: 175, img: 'https://loremflickr.com/300/300/sunglasses?lock=69' },
  { id: 'prod-v3-70', name: 'Luxury Makeup #70', hash: 'Size 42', price: 161, img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-71', name: 'Luxury Perfume #71', hash: 'Size 43', price: 20, img: 'https://loremflickr.com/300/300/perfume?lock=71' },
  { id: 'prod-v3-72', name: 'Luxury Sneakers #72', hash: 'Size 36', price: 170, img: 'https://loremflickr.com/300/300/sneakers?lock=72' },
  { id: 'prod-v3-73', name: 'Luxury Jeans #73', hash: 'Size 37', price: 95, img: 'https://loremflickr.com/300/300/jeans?lock=73' },
  { id: 'prod-v3-74', name: 'Luxury Dress #74', hash: 'Size 38', price: 99, img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-75', name: 'Luxury Handbag #75', hash: 'Size 39', price: 238, img: 'https://loremflickr.com/300/300/handbag?lock=75' },
  { id: 'prod-v3-76', name: 'Luxury T-Shirt #76', hash: 'Size 40', price: 228, img: 'https://loremflickr.com/300/300/tshirt?lock=76' },
  { id: 'prod-v3-77', name: 'Luxury Jacket #77', hash: 'Size 41', price: 105, img: 'https://loremflickr.com/300/300/jacket?lock=77' },
  { id: 'prod-v3-78', name: 'Luxury Watch #78', hash: 'Size 42', price: 67, img: 'https://loremflickr.com/300/300/watch?lock=78' },
  { id: 'prod-v3-79', name: 'Luxury Heels #79', hash: 'Size 43', price: 153, img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-80', name: 'Luxury Jewelry #80', hash: 'Size 36', price: 265, img: 'https://loremflickr.com/300/300/jewelry?lock=80' },
  { id: 'prod-v3-81', name: 'Luxury Sunglasses #81', hash: 'Size 37', price: 132, img: 'https://loremflickr.com/300/300/sunglasses?lock=81' },
  { id: 'prod-v3-82', name: 'Luxury Makeup #82', hash: 'Size 38', price: 224, img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-83', name: 'Luxury Perfume #83', hash: 'Size 39', price: 111, img: 'https://loremflickr.com/300/300/perfume?lock=83' },
  { id: 'prod-v3-84', name: 'Luxury Sneakers #84', hash: 'Size 40', price: 30, img: 'https://loremflickr.com/300/300/sneakers?lock=84' },
  { id: 'prod-v3-85', name: 'Luxury Jeans #85', hash: 'Size 41', price: 99, img: 'https://loremflickr.com/300/300/jeans?lock=85' },
  { id: 'prod-v3-86', name: 'Luxury Dress #86', hash: 'Size 42', price: 63, img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-87', name: 'Luxury Handbag #87', hash: 'Size 43', price: 261, img: 'https://loremflickr.com/300/300/handbag?lock=87' },
  { id: 'prod-v3-88', name: 'Luxury T-Shirt #88', hash: 'Size 36', price: 127, img: 'https://loremflickr.com/300/300/tshirt?lock=88' },
  { id: 'prod-v3-89', name: 'Luxury Jacket #89', hash: 'Size 37', price: 66, img: 'https://loremflickr.com/300/300/jacket?lock=89' },
  { id: 'prod-v3-90', name: 'Luxury Watch #90', hash: 'Size 38', price: 156, img: 'https://loremflickr.com/300/300/watch?lock=90' },
  { id: 'prod-v3-91', name: 'Luxury Heels #91', hash: 'Size 39', price: 68, img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-92', name: 'Luxury Jewelry #92', hash: 'Size 40', price: 70, img: 'https://loremflickr.com/300/300/jewelry?lock=92' },
  { id: 'prod-v3-93', name: 'Luxury Sunglasses #93', hash: 'Size 41', price: 277, img: 'https://loremflickr.com/300/300/sunglasses?lock=93' },
  { id: 'prod-v3-94', name: 'Luxury Makeup #94', hash: 'Size 42', price: 270, img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-95', name: 'Luxury Perfume #95', hash: 'Size 43', price: 255, img: 'https://loremflickr.com/300/300/perfume?lock=95' },
  { id: 'prod-v3-96', name: 'Luxury Sneakers #96', hash: 'Size 36', price: 168, img: 'https://loremflickr.com/300/300/sneakers?lock=96' },
  { id: 'prod-v3-97', name: 'Luxury Jeans #97', hash: 'Size 37', price: 219, img: 'https://loremflickr.com/300/300/jeans?lock=97' },
  { id: 'prod-v3-98', name: 'Luxury Dress #98', hash: 'Size 38', price: 207, img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'prod-v3-99', name: 'Luxury Handbag #99', hash: 'Size 39', price: 40, img: 'https://loremflickr.com/300/300/handbag?lock=99' },
  { id: 'prod-v3-100', name: 'Luxury T-Shirt #100', hash: 'Size 40', price: 162, img: 'https://loremflickr.com/300/300/tshirt?lock=100' }
];

const initialNfts = [
  { id: 'nft-v3-1', creatorId: 'system', ownerId: 'system', title: 'Premium Cyberpunk #6808', description: 'Exclusive digital asset.', price: 245, imageUrl: 'https://loremflickr.com/300/300/cyberpunk?lock=1', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-2', creatorId: 'system', ownerId: 'system', title: 'Premium Abstractart #9607', description: 'Exclusive digital asset.', price: 307.8, imageUrl: 'https://loremflickr.com/300/300/abstractart?lock=2', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-3', creatorId: 'system', ownerId: 'system', title: 'Premium 3drender #6195', description: 'Exclusive digital asset.', price: 42, imageUrl: 'https://loremflickr.com/300/300/3drender?lock=3', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-4', creatorId: 'system', ownerId: 'system', title: 'Premium Digitalavatar #9376', description: 'Exclusive digital asset.', price: 170.9, imageUrl: 'https://loremflickr.com/300/300/digitalavatar?lock=4', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-5', creatorId: 'system', ownerId: 'system', title: 'Premium Nft #3944', description: 'Exclusive digital asset.', price: 493.5, imageUrl: 'https://loremflickr.com/300/300/nft?lock=5', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-6', creatorId: 'system', ownerId: 'system', title: 'Premium Pixelart #8494', description: 'Exclusive digital asset.', price: 62.4, imageUrl: 'https://loremflickr.com/300/300/pixelart?lock=6', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-7', creatorId: 'system', ownerId: 'system', title: 'Premium Futuristic #6289', description: 'Exclusive digital asset.', price: 331.8, imageUrl: 'https://loremflickr.com/300/300/futuristic?lock=7', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-8', creatorId: 'system', ownerId: 'system', title: 'Premium Surrealism #8317', description: 'Exclusive digital asset.', price: 362.9, imageUrl: 'https://loremflickr.com/300/300/surrealism?lock=8', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-9', creatorId: 'system', ownerId: 'system', title: 'Premium Neon #9313', description: 'Exclusive digital asset.', price: 223.5, imageUrl: 'https://loremflickr.com/300/300/neon?lock=9', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-10', creatorId: 'system', ownerId: 'system', title: 'Premium Cryptoart #6511', description: 'Exclusive digital asset.', price: 238, imageUrl: 'https://loremflickr.com/300/300/cryptoart?lock=10', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-11', creatorId: 'system', ownerId: 'system', title: 'Premium Cyberpunk #9389', description: 'Exclusive digital asset.', price: 427.1, imageUrl: 'https://loremflickr.com/300/300/cyberpunk?lock=11', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-12', creatorId: 'system', ownerId: 'system', title: 'Premium Abstractart #8132', description: 'Exclusive digital asset.', price: 463.1, imageUrl: 'https://loremflickr.com/300/300/abstractart?lock=12', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-13', creatorId: 'system', ownerId: 'system', title: 'Premium 3drender #4629', description: 'Exclusive digital asset.', price: 267.8, imageUrl: 'https://loremflickr.com/300/300/3drender?lock=13', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-14', creatorId: 'system', ownerId: 'system', title: 'Premium Digitalavatar #3338', description: 'Exclusive digital asset.', price: 497.8, imageUrl: 'https://loremflickr.com/300/300/digitalavatar?lock=14', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-15', creatorId: 'system', ownerId: 'system', title: 'Premium Nft #3429', description: 'Exclusive digital asset.', price: 276.8, imageUrl: 'https://loremflickr.com/300/300/nft?lock=15', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-16', creatorId: 'system', ownerId: 'system', title: 'Premium Pixelart #6654', description: 'Exclusive digital asset.', price: 395.7, imageUrl: 'https://loremflickr.com/300/300/pixelart?lock=16', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-17', creatorId: 'system', ownerId: 'system', title: 'Premium Futuristic #5142', description: 'Exclusive digital asset.', price: 119.1, imageUrl: 'https://loremflickr.com/300/300/futuristic?lock=17', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-18', creatorId: 'system', ownerId: 'system', title: 'Premium Surrealism #6706', description: 'Exclusive digital asset.', price: 435, imageUrl: 'https://loremflickr.com/300/300/surrealism?lock=18', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-19', creatorId: 'system', ownerId: 'system', title: 'Premium Neon #6529', description: 'Exclusive digital asset.', price: 199.2, imageUrl: 'https://loremflickr.com/300/300/neon?lock=19', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-20', creatorId: 'system', ownerId: 'system', title: 'Premium Cryptoart #8361', description: 'Exclusive digital asset.', price: 92.4, imageUrl: 'https://loremflickr.com/300/300/cryptoart?lock=20', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-21', creatorId: 'system', ownerId: 'system', title: 'Premium Cyberpunk #6575', description: 'Exclusive digital asset.', price: 252, imageUrl: 'https://loremflickr.com/300/300/cyberpunk?lock=21', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-22', creatorId: 'system', ownerId: 'system', title: 'Premium Abstractart #3682', description: 'Exclusive digital asset.', price: 410.7, imageUrl: 'https://loremflickr.com/300/300/abstractart?lock=22', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-23', creatorId: 'system', ownerId: 'system', title: 'Premium 3drender #5947', description: 'Exclusive digital asset.', price: 29.5, imageUrl: 'https://loremflickr.com/300/300/3drender?lock=23', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-24', creatorId: 'system', ownerId: 'system', title: 'Premium Digitalavatar #7601', description: 'Exclusive digital asset.', price: 283.9, imageUrl: 'https://loremflickr.com/300/300/digitalavatar?lock=24', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-25', creatorId: 'system', ownerId: 'system', title: 'Premium Nft #1563', description: 'Exclusive digital asset.', price: 313.4, imageUrl: 'https://loremflickr.com/300/300/nft?lock=25', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-26', creatorId: 'system', ownerId: 'system', title: 'Premium Pixelart #6476', description: 'Exclusive digital asset.', price: 172.2, imageUrl: 'https://loremflickr.com/300/300/pixelart?lock=26', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-27', creatorId: 'system', ownerId: 'system', title: 'Premium Futuristic #5021', description: 'Exclusive digital asset.', price: 417.3, imageUrl: 'https://loremflickr.com/300/300/futuristic?lock=27', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-28', creatorId: 'system', ownerId: 'system', title: 'Premium Surrealism #6953', description: 'Exclusive digital asset.', price: 269.2, imageUrl: 'https://loremflickr.com/300/300/surrealism?lock=28', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-29', creatorId: 'system', ownerId: 'system', title: 'Premium Neon #5185', description: 'Exclusive digital asset.', price: 147.8, imageUrl: 'https://loremflickr.com/300/300/neon?lock=29', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-30', creatorId: 'system', ownerId: 'system', title: 'Premium Cryptoart #9790', description: 'Exclusive digital asset.', price: 265.7, imageUrl: 'https://loremflickr.com/300/300/cryptoart?lock=30', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-31', creatorId: 'system', ownerId: 'system', title: 'Premium Cyberpunk #2989', description: 'Exclusive digital asset.', price: 123, imageUrl: 'https://loremflickr.com/300/300/cyberpunk?lock=31', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-32', creatorId: 'system', ownerId: 'system', title: 'Premium Abstractart #7058', description: 'Exclusive digital asset.', price: 473.3, imageUrl: 'https://loremflickr.com/300/300/abstractart?lock=32', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-33', creatorId: 'system', ownerId: 'system', title: 'Premium 3drender #8655', description: 'Exclusive digital asset.', price: 362.9, imageUrl: 'https://loremflickr.com/300/300/3drender?lock=33', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-34', creatorId: 'system', ownerId: 'system', title: 'Premium Digitalavatar #4332', description: 'Exclusive digital asset.', price: 261.6, imageUrl: 'https://loremflickr.com/300/300/digitalavatar?lock=34', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-35', creatorId: 'system', ownerId: 'system', title: 'Premium Nft #4490', description: 'Exclusive digital asset.', price: 62.7, imageUrl: 'https://loremflickr.com/300/300/nft?lock=35', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-36', creatorId: 'system', ownerId: 'system', title: 'Premium Pixelart #4443', description: 'Exclusive digital asset.', price: 288.5, imageUrl: 'https://loremflickr.com/300/300/pixelart?lock=36', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-37', creatorId: 'system', ownerId: 'system', title: 'Premium Futuristic #5317', description: 'Exclusive digital asset.', price: 410.7, imageUrl: 'https://loremflickr.com/300/300/futuristic?lock=37', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-38', creatorId: 'system', ownerId: 'system', title: 'Premium Surrealism #1772', description: 'Exclusive digital asset.', price: 180, imageUrl: 'https://loremflickr.com/300/300/surrealism?lock=38', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-39', creatorId: 'system', ownerId: 'system', title: 'Premium Neon #4316', description: 'Exclusive digital asset.', price: 24.8, imageUrl: 'https://loremflickr.com/300/300/neon?lock=39', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-40', creatorId: 'system', ownerId: 'system', title: 'Premium Cryptoart #1376', description: 'Exclusive digital asset.', price: 170.4, imageUrl: 'https://loremflickr.com/300/300/cryptoart?lock=40', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-41', creatorId: 'system', ownerId: 'system', title: 'Premium Cyberpunk #7339', description: 'Exclusive digital asset.', price: 34, imageUrl: 'https://loremflickr.com/300/300/cyberpunk?lock=41', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-42', creatorId: 'system', ownerId: 'system', title: 'Premium Abstractart #4527', description: 'Exclusive digital asset.', price: 308.7, imageUrl: 'https://loremflickr.com/300/300/abstractart?lock=42', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-43', creatorId: 'system', ownerId: 'system', title: 'Premium 3drender #4144', description: 'Exclusive digital asset.', price: 260.9, imageUrl: 'https://loremflickr.com/300/300/3drender?lock=43', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-44', creatorId: 'system', ownerId: 'system', title: 'Premium Digitalavatar #9190', description: 'Exclusive digital asset.', price: 469.8, imageUrl: 'https://loremflickr.com/300/300/digitalavatar?lock=44', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-45', creatorId: 'system', ownerId: 'system', title: 'Premium Nft #1225', description: 'Exclusive digital asset.', price: 378.7, imageUrl: 'https://loremflickr.com/300/300/nft?lock=45', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-46', creatorId: 'system', ownerId: 'system', title: 'Premium Pixelart #6055', description: 'Exclusive digital asset.', price: 298.6, imageUrl: 'https://loremflickr.com/300/300/pixelart?lock=46', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-47', creatorId: 'system', ownerId: 'system', title: 'Premium Futuristic #1326', description: 'Exclusive digital asset.', price: 294, imageUrl: 'https://loremflickr.com/300/300/futuristic?lock=47', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-48', creatorId: 'system', ownerId: 'system', title: 'Premium Surrealism #6718', description: 'Exclusive digital asset.', price: 448.8, imageUrl: 'https://loremflickr.com/300/300/surrealism?lock=48', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-49', creatorId: 'system', ownerId: 'system', title: 'Premium Neon #9056', description: 'Exclusive digital asset.', price: 158.8, imageUrl: 'https://loremflickr.com/300/300/neon?lock=49', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-50', creatorId: 'system', ownerId: 'system', title: 'Premium Cryptoart #6551', description: 'Exclusive digital asset.', price: 480.1, imageUrl: 'https://loremflickr.com/300/300/cryptoart?lock=50', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-51', creatorId: 'system', ownerId: 'system', title: 'Premium Cyberpunk #4232', description: 'Exclusive digital asset.', price: 329.7, imageUrl: 'https://loremflickr.com/300/300/cyberpunk?lock=51', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-52', creatorId: 'system', ownerId: 'system', title: 'Premium Abstractart #9136', description: 'Exclusive digital asset.', price: 220.2, imageUrl: 'https://loremflickr.com/300/300/abstractart?lock=52', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-53', creatorId: 'system', ownerId: 'system', title: 'Premium 3drender #1115', description: 'Exclusive digital asset.', price: 325.1, imageUrl: 'https://loremflickr.com/300/300/3drender?lock=53', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-54', creatorId: 'system', ownerId: 'system', title: 'Premium Digitalavatar #8322', description: 'Exclusive digital asset.', price: 398.2, imageUrl: 'https://loremflickr.com/300/300/digitalavatar?lock=54', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-55', creatorId: 'system', ownerId: 'system', title: 'Premium Nft #1361', description: 'Exclusive digital asset.', price: 463.6, imageUrl: 'https://loremflickr.com/300/300/nft?lock=55', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-56', creatorId: 'system', ownerId: 'system', title: 'Premium Pixelart #2637', description: 'Exclusive digital asset.', price: 284.1, imageUrl: 'https://loremflickr.com/300/300/pixelart?lock=56', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-57', creatorId: 'system', ownerId: 'system', title: 'Premium Futuristic #5387', description: 'Exclusive digital asset.', price: 451.7, imageUrl: 'https://loremflickr.com/300/300/futuristic?lock=57', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-58', creatorId: 'system', ownerId: 'system', title: 'Premium Surrealism #6998', description: 'Exclusive digital asset.', price: 223, imageUrl: 'https://loremflickr.com/300/300/surrealism?lock=58', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-59', creatorId: 'system', ownerId: 'system', title: 'Premium Neon #2667', description: 'Exclusive digital asset.', price: 295, imageUrl: 'https://loremflickr.com/300/300/neon?lock=59', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-60', creatorId: 'system', ownerId: 'system', title: 'Premium Cryptoart #4349', description: 'Exclusive digital asset.', price: 245.5, imageUrl: 'https://loremflickr.com/300/300/cryptoart?lock=60', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-61', creatorId: 'system', ownerId: 'system', title: 'Premium Cyberpunk #2276', description: 'Exclusive digital asset.', price: 130.9, imageUrl: 'https://loremflickr.com/300/300/cyberpunk?lock=61', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-62', creatorId: 'system', ownerId: 'system', title: 'Premium Abstractart #3991', description: 'Exclusive digital asset.', price: 262.8, imageUrl: 'https://loremflickr.com/300/300/abstractart?lock=62', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-63', creatorId: 'system', ownerId: 'system', title: 'Premium 3drender #2864', description: 'Exclusive digital asset.', price: 55.3, imageUrl: 'https://loremflickr.com/300/300/3drender?lock=63', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-64', creatorId: 'system', ownerId: 'system', title: 'Premium Digitalavatar #7226', description: 'Exclusive digital asset.', price: 315.3, imageUrl: 'https://loremflickr.com/300/300/digitalavatar?lock=64', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-65', creatorId: 'system', ownerId: 'system', title: 'Premium Nft #1087', description: 'Exclusive digital asset.', price: 326.2, imageUrl: 'https://loremflickr.com/300/300/nft?lock=65', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-66', creatorId: 'system', ownerId: 'system', title: 'Premium Pixelart #2832', description: 'Exclusive digital asset.', price: 68.1, imageUrl: 'https://loremflickr.com/300/300/pixelart?lock=66', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-67', creatorId: 'system', ownerId: 'system', title: 'Premium Futuristic #5210', description: 'Exclusive digital asset.', price: 322.1, imageUrl: 'https://loremflickr.com/300/300/futuristic?lock=67', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-68', creatorId: 'system', ownerId: 'system', title: 'Premium Surrealism #6462', description: 'Exclusive digital asset.', price: 128.8, imageUrl: 'https://loremflickr.com/300/300/surrealism?lock=68', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-69', creatorId: 'system', ownerId: 'system', title: 'Premium Neon #8434', description: 'Exclusive digital asset.', price: 214.2, imageUrl: 'https://loremflickr.com/300/300/neon?lock=69', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-70', creatorId: 'system', ownerId: 'system', title: 'Premium Cryptoart #2634', description: 'Exclusive digital asset.', price: 425, imageUrl: 'https://loremflickr.com/300/300/cryptoart?lock=70', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-71', creatorId: 'system', ownerId: 'system', title: 'Premium Cyberpunk #4476', description: 'Exclusive digital asset.', price: 209.8, imageUrl: 'https://loremflickr.com/300/300/cyberpunk?lock=71', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-72', creatorId: 'system', ownerId: 'system', title: 'Premium Abstractart #7891', description: 'Exclusive digital asset.', price: 219, imageUrl: 'https://loremflickr.com/300/300/abstractart?lock=72', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-73', creatorId: 'system', ownerId: 'system', title: 'Premium 3drender #8322', description: 'Exclusive digital asset.', price: 93.3, imageUrl: 'https://loremflickr.com/300/300/3drender?lock=73', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-74', creatorId: 'system', ownerId: 'system', title: 'Premium Digitalavatar #8195', description: 'Exclusive digital asset.', price: 221.5, imageUrl: 'https://loremflickr.com/300/300/digitalavatar?lock=74', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-75', creatorId: 'system', ownerId: 'system', title: 'Premium Nft #1235', description: 'Exclusive digital asset.', price: 385.1, imageUrl: 'https://loremflickr.com/300/300/nft?lock=75', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-76', creatorId: 'system', ownerId: 'system', title: 'Premium Pixelart #2443', description: 'Exclusive digital asset.', price: 363.3, imageUrl: 'https://loremflickr.com/300/300/pixelart?lock=76', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-77', creatorId: 'system', ownerId: 'system', title: 'Premium Futuristic #4996', description: 'Exclusive digital asset.', price: 283, imageUrl: 'https://loremflickr.com/300/300/futuristic?lock=77', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-78', creatorId: 'system', ownerId: 'system', title: 'Premium Surrealism #7927', description: 'Exclusive digital asset.', price: 226.5, imageUrl: 'https://loremflickr.com/300/300/surrealism?lock=78', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-79', creatorId: 'system', ownerId: 'system', title: 'Premium Neon #5715', description: 'Exclusive digital asset.', price: 303.7, imageUrl: 'https://loremflickr.com/300/300/neon?lock=79', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-80', creatorId: 'system', ownerId: 'system', title: 'Premium Cryptoart #5714', description: 'Exclusive digital asset.', price: 349.9, imageUrl: 'https://loremflickr.com/300/300/cryptoart?lock=80', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-81', creatorId: 'system', ownerId: 'system', title: 'Premium Cyberpunk #1944', description: 'Exclusive digital asset.', price: 475.7, imageUrl: 'https://loremflickr.com/300/300/cyberpunk?lock=81', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-82', creatorId: 'system', ownerId: 'system', title: 'Premium Abstractart #2288', description: 'Exclusive digital asset.', price: 37.9, imageUrl: 'https://loremflickr.com/300/300/abstractart?lock=82', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-83', creatorId: 'system', ownerId: 'system', title: 'Premium 3drender #1881', description: 'Exclusive digital asset.', price: 254.6, imageUrl: 'https://loremflickr.com/300/300/3drender?lock=83', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-84', creatorId: 'system', ownerId: 'system', title: 'Premium Digitalavatar #8137', description: 'Exclusive digital asset.', price: 453.3, imageUrl: 'https://loremflickr.com/300/300/digitalavatar?lock=84', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-85', creatorId: 'system', ownerId: 'system', title: 'Premium Nft #8310', description: 'Exclusive digital asset.', price: 382.8, imageUrl: 'https://loremflickr.com/300/300/nft?lock=85', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-86', creatorId: 'system', ownerId: 'system', title: 'Premium Pixelart #6491', description: 'Exclusive digital asset.', price: 392, imageUrl: 'https://loremflickr.com/300/300/pixelart?lock=86', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-87', creatorId: 'system', ownerId: 'system', title: 'Premium Futuristic #6793', description: 'Exclusive digital asset.', price: 274.7, imageUrl: 'https://loremflickr.com/300/300/futuristic?lock=87', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-88', creatorId: 'system', ownerId: 'system', title: 'Premium Surrealism #7270', description: 'Exclusive digital asset.', price: 331.3, imageUrl: 'https://loremflickr.com/300/300/surrealism?lock=88', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-89', creatorId: 'system', ownerId: 'system', title: 'Premium Neon #1362', description: 'Exclusive digital asset.', price: 469.1, imageUrl: 'https://loremflickr.com/300/300/neon?lock=89', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-90', creatorId: 'system', ownerId: 'system', title: 'Premium Cryptoart #3622', description: 'Exclusive digital asset.', price: 191.5, imageUrl: 'https://loremflickr.com/300/300/cryptoart?lock=90', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-91', creatorId: 'system', ownerId: 'system', title: 'Premium Cyberpunk #8274', description: 'Exclusive digital asset.', price: 67.2, imageUrl: 'https://loremflickr.com/300/300/cyberpunk?lock=91', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-92', creatorId: 'system', ownerId: 'system', title: 'Premium Abstractart #2021', description: 'Exclusive digital asset.', price: 48.4, imageUrl: 'https://loremflickr.com/300/300/abstractart?lock=92', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-93', creatorId: 'system', ownerId: 'system', title: 'Premium 3drender #6596', description: 'Exclusive digital asset.', price: 60.2, imageUrl: 'https://loremflickr.com/300/300/3drender?lock=93', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-94', creatorId: 'system', ownerId: 'system', title: 'Premium Digitalavatar #1539', description: 'Exclusive digital asset.', price: 486.3, imageUrl: 'https://loremflickr.com/300/300/digitalavatar?lock=94', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-95', creatorId: 'system', ownerId: 'system', title: 'Premium Nft #6728', description: 'Exclusive digital asset.', price: 331.8, imageUrl: 'https://loremflickr.com/300/300/nft?lock=95', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-96', creatorId: 'system', ownerId: 'system', title: 'Premium Pixelart #7924', description: 'Exclusive digital asset.', price: 360.7, imageUrl: 'https://loremflickr.com/300/300/pixelart?lock=96', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-97', creatorId: 'system', ownerId: 'system', title: 'Premium Futuristic #9261', description: 'Exclusive digital asset.', price: 41.8, imageUrl: 'https://loremflickr.com/300/300/futuristic?lock=97', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-98', creatorId: 'system', ownerId: 'system', title: 'Premium Surrealism #7344', description: 'Exclusive digital asset.', price: 307.4, imageUrl: 'https://loremflickr.com/300/300/surrealism?lock=98', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-99', creatorId: 'system', ownerId: 'system', title: 'Premium Neon #1759', description: 'Exclusive digital asset.', price: 120.8, imageUrl: 'https://loremflickr.com/300/300/neon?lock=99', status: 'sale', createdAt: Date.now() },
  { id: 'nft-v3-100', creatorId: 'system', ownerId: 'system', title: 'Premium Cryptoart #7628', description: 'Exclusive digital asset.', price: 355.8, imageUrl: 'https://loremflickr.com/300/300/cryptoart?lock=100', status: 'sale', createdAt: Date.now() }
];

const defaultState: AppState = {
  users: [],
  transactions: [],
  notices: initialNotices,
  systemBalance: 0,
  products: initialProducts,
  orders: [],
  nfts: initialNfts as any,
  nftBids: [],
  supportLink: 'https://t.me/trxhub_support',
  vipLevels: VIP_LEVELS,
  paymentMethods: [
    { id: '1', name: 'TRC20 Network', network: 'TRC20', address: 'TDepositAddressxxxxxxxxxxxxx1' },
    { id: '2', name: 'ERC20 Network', network: 'ERC20', address: '0xDepositAddressxxxxxxxxxx2' },
    { id: '3', name: 'BEP20 Network', network: 'BEP20', address: '0xDepositAddressxxxxxxxxxx3' }
  ],
  stakes: [],
  stakeSettings: { interestRate: 90, minStake: 100, maxStake: 4000 },
  banners: [
    'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&q=80&w=600&h=300'
  ],
  billboardText: 'Welcome to NovaX! Start your earning journey today.',
  billboardEnabled: true,
  referralBonusText: "Invite friends and earn rewards!\n\n• 50 Active Referrals = 100 XRP Bonus\n• 100 Active Referrals = 200 XRP Bonus\n• 500 Active Referrals = 1,000 XRP Bonus\n\n*Note: Active referrals mean your friends must make a deposit.",
  depositBonusText: "Top up your account to unlock additional XRP Rewards tailored for new members.\n\n• Deposit 100 XRP = 10% Bonus\n• Deposit 500 XRP = 15% Bonus\n• Deposit 1000+ XRP = 20% Bonus",
  referralSystemEnabled: true,
  referralLevel1Rate: 10,
  referralLevel2Rate: 5,
  referralLevel3Rate: 2,
  dailyRewards: [2, 5, 10, 15, 20, 30, 50],
  gameCrashWinRate: 48,
  gameRocketWinRate: 48,
  gameCoinWinRate: 48,
  gameDiceWinRate: 48,
  gameSlotsWinRate: 48,
  gameFishWinRate: 48,
  gameCoinFlipEnabled: true,
  gameDiceRollEnabled: true,
  gameCrashEnabled: true,
  gameSlotsEnabled: true,
  gameFishEnabled: false,
  gameWheelEnabled: true,
  gameMinesEnabled: true,
  gamePlinkoEnabled: true,
  gameTowerEnabled: true,
};

function updateLocalState(updates: Partial<AppState>) {
  const current = store.getState();
  const newState = { ...current, ...updates };
  localStorage.setItem(STORE_KEY, btoa(unescape(encodeURIComponent(JSON.stringify(newState)))));
  window.dispatchEvent(new Event('store_updated'));
}

export const store = {
  getState: (): AppState => {
    try {
      const storedRaw = localStorage.getItem(STORE_KEY);
      if (storedRaw) {
        return JSON.parse(decodeURIComponent(escape(atob(storedRaw))));
      }
    } catch (e) {
      console.error('Error reading store', e);
    }
    return defaultState;
  },

  clearUserSubscriptions: () => {
    unsubscribers.forEach(u => u());
    unsubscribers = [];
  },

  initFirebase: async (uid: string) => {
    store.clearUserSubscriptions();

    // Check user role
    let isAdmin = false;
    const user = auth.currentUser;
    if (user && (user.email === 'biplob40000a@gmail.com' || user.email === 'admin@trxhub.com')) {
      isAdmin = true;
    } else {
      const userDocRef = doc(db, 'users', uid);
      try {
        const snap = await getDoc(userDocRef);
        if (snap.exists() && snap.data().role === 'admin') {
          isAdmin = true;
        }
      } catch (e) {
          console.error("Checking admin failed");
      }
    }

    // 1. Users Collection
    const u1 = onSnapshot(collection(db, 'users'), snapshot => {
      updateLocalState({ users: snapshot.docs.map(d => d.data() as User) });
    }, error => {
      console.error('Users listener error:', error);
    });
    unsubscribers.push(u1);

    // 2. Transactions
    const txQuery = isAdmin ? collection(db, 'transactions') : query(collection(db, 'transactions'), where('userId', '==', uid));
    const u3 = onSnapshot(txQuery, snapshot => {
      updateLocalState({ transactions: snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Transaction)).sort((a, b) => b.timestamp - a.timestamp) });
    }, error => console.error("Transactions listener error:", error));
    unsubscribers.push(u3);

    // 3. Orders
    const orderQuery = isAdmin ? collection(db, 'orders') : query(collection(db, 'orders'), where('userId', '==', uid));
    const u4 = onSnapshot(orderQuery, snapshot => {
      updateLocalState({ orders: snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Order)).sort((a, b) => b.timestamp - a.timestamp) });
    }, error => console.error("Orders listener error:", error));
    unsubscribers.push(u4);

    const uNfts = onSnapshot(collection(db, 'nfts'), snapshot => {
      updateLocalState({ nfts: snapshot.docs.map(d => ({ ...d.data(), id: d.id } as any)) });
    }, error => console.warn("NFTs listener error:", error));
    unsubscribers.push(uNfts);

    const uNftBids = onSnapshot(collection(db, 'nftBids'), snapshot => {
      updateLocalState({ nftBids: snapshot.docs.map(d => ({ ...d.data(), id: d.id } as any)) });
    }, error => console.warn("NFT Bids listener error:", error));
    unsubscribers.push(uNftBids);

    // 4. Products
    const u5 = onSnapshot(collection(db, 'products'), snapshot => {
      updateLocalState({ products: snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Product)) });
    }, error => console.error("Products listener error:", error));
    unsubscribers.push(u5);

    // 5. Notices
    const u6 = onSnapshot(collection(db, 'notices'), snapshot => {
      updateLocalState({ notices: snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Notice)).sort((a, b) => b.timestamp - a.timestamp) });
    }, error => console.error("Notices listener error:", error));
    unsubscribers.push(u6);

    // 5B. News
    const uNews = onSnapshot(collection(db, 'news'), snapshot => {
      updateLocalState({ news: snapshot.docs.map(d => ({ ...d.data(), id: d.id })).sort((a: any, b: any) => b.timestamp - a.timestamp) });
    }, error => console.warn("News listener error:", error));
    unsubscribers.push(uNews);

    // 6. Payment Methods
    const u7 = onSnapshot(collection(db, 'paymentMethods'), snapshot => {
      updateLocalState({ paymentMethods: snapshot.docs.map(d => ({ ...d.data(), id: d.id } as PaymentMethod)) });
    }, error => console.error("PaymentMethods listener error:", error));
    unsubscribers.push(u7);

    // 7. System Config
    const u8 = onSnapshot(doc(db, 'config', 'system'), snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        updateLocalState({
          supportLink: data.supportLink,
          systemBalance: data.systemBalance,
          vipLevels: data.vipLevels || VIP_LEVELS,
          stakeSettings: data.stakeSettings || { interestRate: 90, minStake: 100, maxStake: 4000 },
          banners: data.banners || [],
          billboardText: data.billboardText !== undefined ? data.billboardText : 'Welcome to NovaX! Start your earning journey today.',
          billboardEnabled: data.billboardEnabled !== undefined ? data.billboardEnabled : true,
          referralBonusText: data.referralBonusText !== undefined ? data.referralBonusText : "Invite friends and earn rewards!\n\n• 50 Active Referrals = 100 XRP Bonus\n• 100 Active Referrals = 200 XRP Bonus\n• 500 Active Referrals = 1,000 XRP Bonus\n\n*Note: Active referrals mean your friends must make a deposit.",
          depositBonusText: data.depositBonusText !== undefined ? data.depositBonusText : "Top up your account to unlock additional XRP Rewards tailored for new members.\n\n• Deposit 100 XRP = 10% Bonus\n• Deposit 500 XRP = 15% Bonus\n• Deposit 1000+ XRP = 20% Bonus",
          referralSystemEnabled: data.referralSystemEnabled !== undefined ? data.referralSystemEnabled : true,
          referralLevel1Rate: data.referralLevel1Rate !== undefined ? data.referralLevel1Rate : 10,
          referralLevel2Rate: data.referralLevel2Rate !== undefined ? data.referralLevel2Rate : 5,
          referralLevel3Rate: data.referralLevel3Rate !== undefined ? data.referralLevel3Rate : 2,
          dailyRewards: data.dailyRewards || [2, 5, 10, 15, 20, 30, 50],
          gameCrashWinRate: data.gameCrashWinRate !== undefined ? data.gameCrashWinRate : 48,
          gameRocketWinRate: data.gameRocketWinRate !== undefined ? data.gameRocketWinRate : 48,
          gameCoinWinRate: data.gameCoinWinRate !== undefined ? data.gameCoinWinRate : 48,
          gameDiceWinRate: data.gameDiceWinRate !== undefined ? data.gameDiceWinRate : 48,
          gameSlotsWinRate: data.gameSlotsWinRate !== undefined ? data.gameSlotsWinRate : 48,
          gameFishWinRate: data.gameFishWinRate !== undefined ? data.gameFishWinRate : 48,
          gameCoinFlipEnabled: data.gameCoinFlipEnabled !== undefined ? data.gameCoinFlipEnabled : true,
          gameDiceRollEnabled: data.gameDiceRollEnabled !== undefined ? data.gameDiceRollEnabled : true,
          gameCrashEnabled: data.gameCrashEnabled !== undefined ? data.gameCrashEnabled : true,
          gameSlotsEnabled: data.gameSlotsEnabled !== undefined ? data.gameSlotsEnabled : true,
          gameFishEnabled: data.gameFishEnabled !== undefined ? data.gameFishEnabled : false,
          gameWheelEnabled: data.gameWheelEnabled !== undefined ? data.gameWheelEnabled : true,
          gameMinesEnabled: data.gameMinesEnabled !== undefined ? data.gameMinesEnabled : true,
          gamePlinkoEnabled: data.gamePlinkoEnabled !== undefined ? data.gamePlinkoEnabled : true,
          gameTowerEnabled: data.gameTowerEnabled !== undefined ? data.gameTowerEnabled : true,
        });
      }
    }, error => console.error("Config listener error:", error));
    unsubscribers.push(u8);

    // 7. Stakes
    const stakeQuery = isAdmin ? collection(db, 'stakes') : query(collection(db, 'stakes'), where('userId', '==', uid));
    const u9 = onSnapshot(stakeQuery, snapshot => {
      // @ts-ignore
      updateLocalState({ stakes: snapshot.docs.map(d => ({ ...d.data(), id: d.id })).sort((a, b) => b.timestamp - a.timestamp) });
    }, error => console.error("Stakes listener error:", error));
    unsubscribers.push(u9);

    // 8. Bets
    const betQuery = isAdmin ? collection(db, 'bets') : query(collection(db, 'bets'), where('userId', '==', uid));
    const u10 = onSnapshot(betQuery, snapshot => {
      // @ts-ignore
      updateLocalState({ bets: snapshot.docs.map(d => ({ ...d.data(), id: d.id })).sort((a, b) => b.timestamp - a.timestamp) });
    }, error => console.warn("Bets listener error:", error));
    unsubscribers.push(u10);

    // Initial Database Seed for Admins
    if (isAdmin) {
       getDoc(doc(db, 'config', 'system')).then(async snap => {
          if (!snap.exists()) {
             console.log("Seeding Database...");
             await setDoc(doc(db, 'config', 'system'), { 
                supportLink: 'https://t.me/trxhub_support', 
                systemBalance: 0,
                vipLevels: VIP_LEVELS,
                stakeSettings: { interestRate: 2, minStake: 100, maxStake: 4000 }
             });
             for(let n of initialNotices) { await setDoc(doc(db, 'notices', n.id), n); }
             for(let p of initialProducts) { await setDoc(doc(db, 'products', p.id), p); }
             for(let nft of initialNfts) { await setDoc(doc(db, 'nfts', nft.id), nft); }
             await setDoc(doc(db, 'paymentMethods', '1'), { name: 'TRC20 Network', network: 'TRC20', address: 'TDepositAddressxxxxxxxxxxxxx1' });
             await setDoc(doc(db, 'paymentMethods', '2'), { name: 'ERC20 Network', network: 'ERC20', address: '0xDepositAddressxxxxxxxxxx2' });
             await setDoc(doc(db, 'paymentMethods', '3'), { name: 'BEP20 Network', network: 'BEP20', address: '0xDepositAddressxxxxxxxxxx3' });
          } else {
             // Sync VIP_LEVELS and Payment Methods
             const data = snap.data();
             let updated = false;
             let newVipLevels = data.vipLevels || [];
             if (newVipLevels.find((v: any) => v.level === 1 && v.price === 100)) {
               newVipLevels = newVipLevels.map((v: any) => v.level === 1 ? { ...v, price: 30 } : v);
               updated = true;
             }
             // Ensure levels 5-8 exist
             for (let level = 5; level <= 8; level++) {
               if (!newVipLevels.find((v: any) => v.level === level)) {
                 const defaultLayer = VIP_LEVELS.find(v => v.level === level);
                 if (defaultLayer) {
                   newVipLevels.push(defaultLayer);
                   updated = true;
                 }
               }
             }
             if (updated) {
               await setDoc(doc(db, 'config', 'system'), { vipLevels: newVipLevels }, { merge: true });
             }

             // Ensure initial Products exist
             try {
               const prodSnap = await getDocs(collection(db, 'products'));
               if (!prodSnap.docs.find(d => d.id === "prod-v3-100")) {
                 for(let p of initialProducts) { await setDoc(doc(db, 'products', p.id), p); }
               }
             } catch(e) { console.warn("Error seeding Products", e); }
             
             // Ensure initial NFTs exist
             try {
               const nftSnap = await getDocs(collection(db, 'nfts'));
               if (!nftSnap.docs.find(d => d.id === "nft-v3-100")) {
                 for(let nft of initialNfts) { await setDoc(doc(db, 'nfts', nft.id), nft); }
               }
             } catch(e) { console.warn("Error seeding NFTs", e); }

             // Auto migrate legacy Binance/Bybit methods
             try {
               const pmSnapshot = await getDocs(collection(db, 'paymentMethods'));
               let hasBEP20 = false;
               
               for (const d of pmSnapshot.docs) {
                 const name = d.data().name || '';
                 const lowerName = name.toLowerCase();
                 if (lowerName.includes('binance')) {
                   await setDoc(d.ref, { ...d.data(), name: 'TRC20 Network', network: 'TRC20' }, { merge: true });
                 } else if (lowerName.includes('bybit')) {
                   await setDoc(d.ref, { ...d.data(), name: 'ERC20 Network', network: 'ERC20' }, { merge: true });
                 }
                 
                 if (lowerName.includes('bep20')) {
                   hasBEP20 = true;
                 }
               }
               
               if (!hasBEP20) {
                 await setDoc(doc(db, 'paymentMethods', 'bep20-default'), { name: 'BNB Smart Chain (BEP20)', network: 'BEP20', address: '0xDepositAddressxxxxxxxxxx3' });
               }
             } catch(e) {}
          }
          
          // Price fluctuation interval for Admin (runs the global simulation)
          // (Removed to prevent UI freezing and massive Firestore write spikes)
       });
    }
  },

  // Users
  getUserByUsername: (username: string) => {
    return store.getState().users.find(u => u.username === username);
  },

  updateUser: async (id: string, updates: Partial<User>) => {
    // Optimistic Update
    const state = store.getState();
    updateLocalState({ users: state.users.map(u => u.id === id ? { ...u, ...updates } : u) });
    try {
      if (auth.currentUser && auth.currentUser.uid === id) {
         try {
           const idToken = await auth.currentUser.getIdToken();
           
           // If it's a balance update (bet/win), route it to secure game endpoints
           if (updates.balance !== undefined && Object.keys(updates).length === 1) {
             const currentUser = state.users.find(u => u.id === id);
             if (currentUser) {
               const diff = updates.balance - currentUser.balance;
               let apiRes;
               if (diff < 0) {
                 apiRes = await fetch('/api/game/bet', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ idToken, userId: id, amount: Math.abs(diff) })
                 });
               } else if (diff > 0) {
                 apiRes = await fetch('/api/game/cashout', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ idToken, userId: id, winAmount: diff })
                 });
               }
               
               if (apiRes && apiRes.ok) {
                  const data = await apiRes.json().catch(() => ({}));
                  if (data.warning) {
                     await setDoc(doc(db, 'users', id), updates, { merge: true });
                  }
               } else {
                  await setDoc(doc(db, 'users', id), updates, { merge: true });
               }
             }
             return; // Balance handled via transaction
           }

           // Normal profile update
           const res = await fetch('/api/user/secure-update', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ idToken, updates })
           });
           if (res.ok) {
             const data = await res.json().catch(() => ({}));
             if (data.warning) {
                await setDoc(doc(db, 'users', id), updates, { merge: true });
             }
           } else {
             console.error("Secure API update failed, trying direct Firestore fallback");
             await setDoc(doc(db, 'users', id), updates, { merge: true });
           }
         } catch(err) {
           console.error("Secure update failed:", err);
           await setDoc(doc(db, 'users', id), updates, { merge: true });
         }
      } else {
        await setDoc(doc(db, 'users', id), updates, { merge: true });
      }
    } catch (e) { console.error("Error updating user", e); }
  },

  addUser: (user: any) => {
     return user;
  },

  deleteUser: async (id: string) => {
    const state = store.getState();
    updateLocalState({ users: state.users.filter(u => u.id !== id) });
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (e) { console.error("Error deleting user", e); }
  },

  // Transactions
  addTransaction: async (tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const id = generateId();
    const newTx: Transaction = { ...tx, id, timestamp: Date.now() };
    const state = store.getState();
    updateLocalState({ transactions: [newTx, ...state.transactions] });
    try {
      await setDoc(doc(db, 'transactions', id), newTx);
      return newTx;
    } catch (e) { console.error("Error adding transaction", e); return newTx; }
  },
  
  updateTransaction: async (id: string, updates: Partial<Transaction>) => {
    const state = store.getState();
    updateLocalState({ transactions: state.transactions.map(t => t.id === id ? { ...t, ...updates } : t) });
    try {
      await setDoc(doc(db, 'transactions', id), updates, { merge: true });
    } catch(e) { console.error("Error updating transaction", e); }
  },

  // Products
  addProduct: async (product: Omit<Product, 'id'>) => {
    const id = generateId();
    const newProduct = { ...product, id };
    const state = store.getState();
    updateLocalState({ products: [...state.products, newProduct] });
    try {
      await setDoc(doc(db, 'products', id), newProduct);
      return newProduct;
    } catch (e) { console.error("Error adding product", e); return newProduct; }
  },

  updateProduct: async (id: string, updates: Partial<Product>) => {
    const state = store.getState();
    updateLocalState({ products: state.products.map(p => p.id === id ? { ...p, ...updates } : p) });
    try {
      await setDoc(doc(db, 'products', id), updates, { merge: true });
    } catch (e) { console.error("Error updating product", e); }
  },

  deleteProduct: async (id: string) => {
    const state = store.getState();
    updateLocalState({ products: state.products.filter(p => p.id !== id) });
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (e) { console.error("Error deleting product", e); }
  },

  // NFTs
  createNFT: async (nftData: any) => {
    const id = generateId();
    const newNFT = { ...nftData, id, createdAt: Date.now() };
    try {
      await setDoc(doc(db, 'nfts', id), newNFT);
      return newNFT;
    } catch (e) { console.error("Error creating NFT", e); throw e; }
  },
  
  updateNFT: async (id: string, updates: any) => {
    try {
      await setDoc(doc(db, 'nfts', id), updates, { merge: true });
    } catch (e) { console.error("Error updating NFT", e); throw e; }
  },

  deleteNFT: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'nfts', id));
    } catch (e) { console.error("Error deleting NFT", e); throw e; }
  },

  createNFTBid: async (bidData: any) => {
    const id = generateId();
    const newBid = { ...bidData, id, timestamp: Date.now() };
    try {
      await setDoc(doc(db, 'nftBids', id), newBid);
      return newBid;
    } catch (e) { console.error("Error creating NFT Bid", e); throw e; }
  },
  
  updateNFTBid: async (id: string, updates: any) => {
    try {
      await setDoc(doc(db, 'nftBids', id), updates, { merge: true });
    } catch (e) { console.error("Error updating NFT Bid", e); throw e; }
  },

  // Orders
  addOrder: async (order: Omit<Order, 'id' | 'timestamp'>) => {
    const id = generateId();
    const newOrder: Order = { ...order, id, timestamp: Date.now() };
    const state = store.getState();
    updateLocalState({ orders: [newOrder, ...state.orders] });
    try {
      await setDoc(doc(db, 'orders', id), newOrder);
      return newOrder;
    } catch (e) { console.error("Error adding order", e); return newOrder; }
  },

  // Bets
  addBet: async (bet: Omit<BetRecord, 'id' | 'timestamp'>) => {
    const id = generateId();
    const newBet = { ...bet, id, timestamp: Date.now() } as BetRecord;
    const state = store.getState();
    updateLocalState({ bets: [newBet, ...(state.bets || [])] });
    try {
      await setDoc(doc(db, 'bets', id), newBet);
      return newBet;
    } catch(e) { console.error("Error adding bet", e); return newBet; }
  },

  updateBet: async (id: string, updates: Partial<BetRecord>) => {
    const state = store.getState();
    updateLocalState({ bets: (state.bets || []).map(b => b.id === id ? { ...b, ...updates } as BetRecord : b) });
    try {
      await setDoc(doc(db, 'bets', id), updates, { merge: true });
    } catch (e) { console.error("Error updating bet", e); }
  },

  // Stakes
  addStake: async (stake: any) => {
    const id = generateId();
    const newStake = { ...stake, id };
    const state = store.getState();
    updateLocalState({ stakes: [newStake, ...(state.stakes || [])] });
    try {
      await setDoc(doc(db, 'stakes', id), newStake);
      return newStake;
    } catch(e) { console.error("Error adding stake", e); return newStake; }
  },

  updateStake: async (id: string, updates: any) => {
    const state = store.getState();
    updateLocalState({ stakes: (state.stakes || []).map(s => s.id === id ? { ...s, ...updates } : s) });
    try {
      await setDoc(doc(db, 'stakes', id), updates, { merge: true });
    } catch (e) { console.error("Error updating stake", e); }
  },

  deleteStake: async (id: string) => {
    const state = store.getState();
    updateLocalState({ stakes: (state.stakes || []).filter(s => s.id !== id) });
    try {
      await deleteDoc(doc(db, 'stakes', id));
    } catch (e) { console.error("Error deleting stake", e); }
  },

  // System
  updateSystemSettings: async (settings: Partial<AppState>) => {
    const state = store.getState();
    updateLocalState({ ...state, ...settings });
    try {
      const { supportLink, systemBalance, stakeSettings, banners, billboardText, billboardEnabled, referralBonusText, depositBonusText, referralSystemEnabled, referralLevel1Rate, referralLevel2Rate, referralLevel3Rate, dailyRewards, gameCrashWinRate, gameRocketWinRate, gameCoinWinRate, gameDiceWinRate, gameSlotsWinRate, gameFishWinRate, gameCoinFlipEnabled, gameDiceRollEnabled, gameCrashEnabled, gameSlotsEnabled, gameFishEnabled, gameWheelEnabled, gameMinesEnabled, gamePlinkoEnabled, gameTowerEnabled } = settings;
      const updates: any = {};
      if (supportLink !== undefined) updates.supportLink = supportLink;
      if (systemBalance !== undefined) updates.systemBalance = systemBalance;
      if (stakeSettings !== undefined) updates.stakeSettings = stakeSettings;
      if (banners !== undefined) updates.banners = banners;
      if (billboardText !== undefined) updates.billboardText = billboardText;
      if (billboardEnabled !== undefined) updates.billboardEnabled = billboardEnabled;
      if (referralBonusText !== undefined) updates.referralBonusText = referralBonusText;
      if (depositBonusText !== undefined) updates.depositBonusText = depositBonusText;
      if (referralSystemEnabled !== undefined) updates.referralSystemEnabled = referralSystemEnabled;
      if (referralLevel1Rate !== undefined) updates.referralLevel1Rate = referralLevel1Rate;
      if (referralLevel2Rate !== undefined) updates.referralLevel2Rate = referralLevel2Rate;
      if (referralLevel3Rate !== undefined) updates.referralLevel3Rate = referralLevel3Rate;
      if (dailyRewards !== undefined) updates.dailyRewards = dailyRewards;
      if (gameCrashWinRate !== undefined) updates.gameCrashWinRate = gameCrashWinRate;
      if (gameRocketWinRate !== undefined) updates.gameRocketWinRate = gameRocketWinRate;
      if (gameCoinWinRate !== undefined) updates.gameCoinWinRate = gameCoinWinRate;
      if (gameDiceWinRate !== undefined) updates.gameDiceWinRate = gameDiceWinRate;
      if (gameSlotsWinRate !== undefined) updates.gameSlotsWinRate = gameSlotsWinRate;
      if (gameFishWinRate !== undefined) updates.gameFishWinRate = gameFishWinRate;
      if (gameCoinFlipEnabled !== undefined) updates.gameCoinFlipEnabled = gameCoinFlipEnabled;
      if (gameDiceRollEnabled !== undefined) updates.gameDiceRollEnabled = gameDiceRollEnabled;
      if (gameCrashEnabled !== undefined) updates.gameCrashEnabled = gameCrashEnabled;
      if (gameSlotsEnabled !== undefined) updates.gameSlotsEnabled = gameSlotsEnabled;
      if (gameFishEnabled !== undefined) updates.gameFishEnabled = gameFishEnabled;
      if (gameWheelEnabled !== undefined) updates.gameWheelEnabled = gameWheelEnabled;
      if (gameMinesEnabled !== undefined) updates.gameMinesEnabled = gameMinesEnabled;
      if (gamePlinkoEnabled !== undefined) updates.gamePlinkoEnabled = gamePlinkoEnabled;
      if (gameTowerEnabled !== undefined) updates.gameTowerEnabled = gameTowerEnabled;
      await setDoc(doc(db, 'config', 'system'), updates, { merge: true });
    } catch (e) { console.error("Error updating config", e); }
  },

  updateVipLevel: async (level: number, updates: Partial<VIPLevel>) => {
    const state = store.getState();
    const vipLevels = state.vipLevels?.map(v => v.level === level ? { ...v, ...updates } : v) || VIP_LEVELS;
    updateLocalState({ vipLevels });
    try {
      await setDoc(doc(db, 'config', 'system'), { vipLevels }, { merge: true });
    } catch (e) { console.error("Error updating VIP", e); }
  },

  // Notices
  addNotice: async (text: string) => {
    const id = generateId();
    const newNotice = { id, text, isActive: true, timestamp: Date.now() };
    const state = store.getState();
    updateLocalState({ notices: [newNotice, ...state.notices] });
    try {
      await setDoc(doc(db, 'notices', id), newNotice);
    } catch (e) { console.error("Error adding notice", e); }
  },

  updateNotice: async (id: string, updates: Partial<Notice>) => {
    const state = store.getState();
    updateLocalState({ notices: state.notices.map(n => n.id === id ? { ...n, ...updates } : n) });
    try {
      await setDoc(doc(db, 'notices', id), updates, { merge: true });
    } catch (e) { console.error("Error updating notice", e); }
  },

  deleteNotice: async (id: string) => {
    const state = store.getState();
    updateLocalState({ notices: state.notices.filter(n => n.id !== id) });
    try {
      await deleteDoc(doc(db, 'notices', id));
    } catch (e) { console.error("Error deleting notice", e); }
  },

  // News
  addNews: async (newsItem: any) => {
    const id = generateId();
    const newNews = { ...newsItem, id, timestamp: Date.now() };
    const state = store.getState();
    updateLocalState({ news: [newNews, ...(state.news || [])] });
    try {
      await setDoc(doc(db, 'news', id), newNews);
    } catch (e) { console.error("Error adding news", e); }
  },

  updateNews: async (id: string, updates: any) => {
    const state = store.getState();
    updateLocalState({ news: (state.news || []).map((n: any) => n.id === id ? { ...n, ...updates } : n) });
    try {
      await setDoc(doc(db, 'news', id), updates, { merge: true });
    } catch (e) { console.error("Error updating news", e); }
  },

  deleteNews: async (id: string) => {
    const state = store.getState();
    updateLocalState({ news: (state.news || []).filter((n: any) => n.id !== id) });
    try {
      await deleteDoc(doc(db, 'news', id));
    } catch (e) { console.error("Error deleting news", e); }
  },

  // Payment Methods
  addPaymentMethod: async (method: Omit<PaymentMethod, 'id'>) => {
    const id = generateId();
    const newMethod = { ...method, id };
    const state = store.getState();
    updateLocalState({ paymentMethods: [...(state.paymentMethods || []), newMethod] });
    try {
      await setDoc(doc(db, 'paymentMethods', id), newMethod);
      return newMethod;
    } catch (e) { console.error("Error adding payment method", e); return newMethod; }
  },

  updatePaymentMethod: async (id: string, updates: Partial<PaymentMethod>) => {
    const state = store.getState();
    updateLocalState({ paymentMethods: (state.paymentMethods || []).map(m => m.id === id ? { ...m, ...updates } : m) });
    try {
      await setDoc(doc(db, 'paymentMethods', id), updates, { merge: true });
    } catch (e) { console.error("Error updating payment method", e); }
  },

  deletePaymentMethod: async (id: string) => {
    const state = store.getState();
    updateLocalState({ paymentMethods: (state.paymentMethods || []).filter(m => m.id !== id) });
    try {
      await deleteDoc(doc(db, 'paymentMethods', id));
    } catch (e) { console.error("Error deleting payment method", e); }
  },

  updateSystemConfig: async (updates: Partial<AppState>) => {
    try {
      await setDoc(doc(db, 'config', 'system'), updates, { merge: true });
    } catch (e) { console.error("Error updating system config", e); }
  }
};
