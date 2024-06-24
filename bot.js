const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');
const cron = require('node-cron');
const serviceAccount = require('./adorabuzz-firebase-adminsdk-ugy7m-fd01aea3f3.json');
const token = '7114080864:AAGqSRVUGjwW9pgR4HsmMRSJP0n6k4E_svM';
const axios = require('axios');
const bot = new TelegramBot(token, { polling: true });
const solanaWeb3 = require('@solana/web3.js');
const bs58 = require('bs58');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// all inline keyboard 
const langmenu = { // Inline Keyboard for New users/invited users to this bot
    inline_keyboard: [
        [{ text: 'English 🌎', callback_data : 'en'} ,],
        [{ text: 'German 🇩🇪', callback_data : 'de'} ,],
    ]
}


let refercode = 'none';


bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const userId = msg.from.id.toString();
    const Code = match[1];
    const first_name = msg.from.first_name;
    const chatId = msg.chat.id.toString();
    const username = msg.from.username;
    
    if (msg.chat.type === 'private') {
        const walletRef = db.collection('wallet1').doc(userId);
        let publicaddress, solBalance, balanceInUSDT;

        const walletDataSnapshot = await walletRef.get();

        if (!walletDataSnapshot.exists) {
            const keypair = solanaWeb3.Keypair.generate();
            publicaddress = keypair.publicKey.toString();
            const privateKey = bs58.encode(keypair.secretKey);
            const walletData = {
                public: publicaddress,
                private: privateKey
            };
            await walletRef.set(walletData);

            const connection = new solanaWeb3.Connection('https://solana-mainnet.g.alchemy.com/v2/3jLoV249kKVXIcUiCp_LuveE81UDNO6g', 'confirmed');
            const balance = await connection.getBalance(new solanaWeb3.PublicKey(publicaddress));
            solBalance = balance / solanaWeb3.LAMPORTS_PER_SOL;

        } else {
            publicaddress = walletDataSnapshot.data().public;

            const connection = new solanaWeb3.Connection('https://solana-mainnet.g.alchemy.com/v2/3jLoV249kKVXIcUiCp_LuveE81UDNO6g', 'confirmed');
            const balance = await connection.getBalance(new solanaWeb3.PublicKey(publicaddress));
            solBalance = balance / solanaWeb3.LAMPORTS_PER_SOL;
        }

        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usdt');
        const solToUSDT = response.data.solana.usdt;
        balanceInUSDT = solBalance * solToUSDT || 0;

        bot.sendMessage(chatId, `💳 Wallet : ${publicaddress}\n⭐️ Balance : ${solBalance} SOL ($${balanceInUSDT.toFixed(2)} USDT)\n\n👉 Send Contract Address of token to start trading, for further help push /help or contact support!`, { parse_mode: 'HTML', reply_markup: JSON.stringify(langmenu) });
    }
});



