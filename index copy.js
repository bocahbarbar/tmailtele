const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

// Token bot Telegram yang didapatkan dari BotFather
const telegramToken = '6340014452:AAFNnMkAquX-VsUnSDXMHZC4SLrfiNwVi1M';
const chatId = '782106563'; // ID chat Telegram Anda (bisa didapatkan dari bot, misalnya @userinfobot)

const bot = new TelegramBot(telegramToken, {
    polling: true
});

// URL API mail.tm untuk mendapatkan pesan
const mailApiUrl = 'https://api.mail.tm/messages';

let lastMessageId = null;

// Fungsi untuk mengambil pesan dari API dan mengirim notifikasi Telegram
async function checkMessages() {
    try {
        const response = await axios.get(mailApiUrl, {
            headers: {
                // Tambahkan header yang diperlukan jika ada, misalnya authorization
                'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpYXQiOjE3MTg2OTUzMTEsInJvbGVzIjpbIlJPTEVfVVNFUiJdLCJhZGRyZXNzIjoibmV0cGxpeEBuYXZhbGNhZGV0cy5jb20iLCJpZCI6IjY2NzEzNThlODk3MDRmOWI1NTAzMGE1YiIsIm1lcmN1cmUiOnsic3Vic2NyaWJlIjpbIi9hY2NvdW50cy82NjcxMzU4ZTg5NzA0ZjliNTUwMzBhNWIiXX19.RrFqC6Bi_HWaOADe5QnBtM8sNMW9lKrGZmV5hkDok1BuenUzxc-n_zvB1QNrCUB6109ng279zvvygpVup-UKjw'
            }
        });
        const messages = response.data['hydra:member'];

        if (messages && messages.length > 0) {
            const latestMessage = messages[0];

            if (latestMessage.id !== lastMessageId) {
                lastMessageId = latestMessage.id;

                const notificationText = `
                Pesan Baru!
                ID: ${latestMessage.id}
                Dari: ${latestMessage.from}
                Subjek: ${latestMessage.subject}
                `;

                // Kirim notifikasi ke Telegram
                bot.sendMessage(chatId, notificationText);
            }
        } else {
            console.log('Tidak ada pesan ditemukan.');
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

// Cek pesan setiap 30 detik
setInterval(checkMessages, 30000);