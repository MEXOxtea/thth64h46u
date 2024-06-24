const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const solanaWeb3 = require('@solana/web3.js');
const bs58 = require('bs58');
const { createClient } = require('redis');

// Bot Token and Redis Configuration
const token = '7114080864:AAGqSRVUGjwW9pgR4HsmMRSJP0n6k4E_svM';
const redisClient = createClient({
    password: '4syzuHeGtpWNnN9v6fyGh2gGNXrfhhwH',
    socket: {
        host: 'redis-18899.c91.us-east-1-3.ec2.redns.redis-cloud.com',
        port: 18899
    }
});

// Initialize Telegram Bot
const bot = new TelegramBot(token, { polling: true });

// Inline Keyboard for Language Selection
const langmenu = {
    inline_keyboard: [
        [{ text: 'English 🌎', callback_data: 'en' }],
        [{ text: 'German 🇩🇪', callback_data: 'de' }]
    ]
};

// Connect to Redis
async function connectRedis() {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
}

// Fetch SOL to USDT conversion rate
async function getSOLPriceInUSDT() {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usdt');
        return response.data.solana.usdt;
    } catch (error) {
        console.error('Error fetching SOL price:', error);
        return 0;
    }
}

// Handle /start command
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const userId = msg.from.id.toString();
    const Code = match ? match[1] : null;
    const first_name = msg.from.first_name;
    const chatId = msg.chat.id.toString();
    const username = msg.from.username;

    if (msg.chat.type === 'private') {
        await connectRedis();
        const key = `wallet1:users:${userId}`;

        // Check if user already exists
        const existingUser = await redisClient.hGetAll(key);
        if (Object.keys(existingUser).length > 0) {
            bot.sendMessage(chatId, `User ${userId} already exists. Data not modified.`);
            const publicKey = existingUser.public;

            // Fetch wallet balance
            const connection = new solanaWeb3.Connection('https://chaotic-frosty-waterfall.solana-mainnet.quiknode.pro/c18eac1bcbac3610b6b8de4eb6725966e2d12037/', 'confirmed');
            const balance = await connection.getBalance(new solanaWeb3.PublicKey(publicKey));
            const solBalance = balance / solanaWeb3.LAMPORTS_PER_SOL;

            // Convert balance to USDT
            const solToUSDT = await getSOLPriceInUSDT();
            const balanceInUSDT = solBalance * solToUSDT || 0;

            bot.sendMessage(chatId, `💳 Wallet: ${publicKey}\n⭐️ Balance: ${solBalance.toFixed(2)} SOL ($${balanceInUSDT.toFixed(2)} USDT)\n\n👉 Send Contract Address of token to start trading, for further help push /help or contact support!`, { parse_mode: 'HTML', reply_markup: JSON.stringify(langmenu) });
            return;
        }

        bot.sendMessage(chatId, 'Hold on, We are generating your wallet!');

        // Generate new Solana wallet
        const keypair = solanaWeb3.Keypair.generate();
        const publicKey = keypair.publicKey.toString();
        const privateKey = bs58.encode(keypair.secretKey);

        await redisClient.hSet(key, {
            userid: userId,
            public: publicKey,
            private: privateKey
        });

        // Fetch wallet balance
        const connection = new solanaWeb3.Connection('https://chaotic-frosty-waterfall.solana-mainnet.quiknode.pro/c18eac1bcbac3610b6b8de4eb6725966e2d12037/', 'confirmed');
        const balance = await connection.getBalance(new solanaWeb3.PublicKey(publicKey));
        const solBalance = balance / solanaWeb3.LAMPORTS_PER_SOL;

        // Convert balance to USDT
        const solToUSDT = await getSOLPriceInUSDT();
        const balanceInUSDT = solBalance * solToUSDT || 0;

        // Send wallet details to user
        bot.sendMessage(chatId, `💳 Wallet: ${publicKey}\n⭐️ Balance: ${solBalance.toFixed(2)} SOL ($${balanceInUSDT.toFixed(2)} USDT)\n\n👉 Send Contract Address of token to start trading, for further help push /help or contact support!`, { parse_mode: 'HTML', reply_markup: JSON.stringify(langmenu) });
    }
});
