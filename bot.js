const TelegramBot = require('node-telegram-bot-api');
const os = require('os');
const { performance } = require('perf_hooks');

const token = '7259127574:AAGKU39y4ccHeRBjdscxVoEA96lyUKLyzeI'; // Replace with your Telegram bot token
const bot = new TelegramBot(token, { polling: true });


bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
bot.sendMessage(chatId, 'Starting performance tests...');

// Measure CPU performance
const cpuStart = performance.now();
for (let i = 0; i < 1e7; i++) {} // CPU-intensive task
const cpuEnd = performance.now();
const cpuTime = cpuEnd - cpuStart;

// Measure Disk I/O performance
const fs = require('fs');
const diskStart = performance.now();
fs.writeFileSync('testfile', 'This is a test file for measuring disk I/O performance.');
fs.readFileSync('testfile');
fs.unlinkSync('testfile');
const diskEnd = performance.now();
const diskTime = diskEnd - diskStart;

// Measure Network latency (ping a well-known server)
const ping = require('ping');
const networkStart = performance.now();
const res = await ping.promise.probe('8.8.8.8');
const networkEnd = performance.now();
const networkTime = networkEnd - networkStart;

// Gather system info
const cpuCount = os.cpus().length;
const memory = os.totalmem();
const uptime = os.uptime();

// Send results to the user
const result = `
*VPS Performance Results*:
CPU Time: ${cpuTime.toFixed(2)} ms
Disk I/O Time: ${diskTime.toFixed(2)} ms
Network Latency: ${networkTime.toFixed(2)} ms
Ping Response Time: ${res.time.toFixed(2)} ms
CPU Count: ${cpuCount}
Total Memory: ${(memory / 1e6).toFixed(2)} MB
Uptime: ${(uptime / 3600).toFixed(2)} hours
`;

bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
});


bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (msg.text !== '/start') {
        bot.sendMessage(chatId, 'Send /start to run the performance tests.');
    }
});


