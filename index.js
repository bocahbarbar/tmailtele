const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const telegramToken = '6340014452:AAFNnMkAquX-VsUnSDXMHZC4SLrfiNwVi1M';
const chatId = '782106563'; // I

const bot = new TelegramBot(telegramToken, {
    polling: true
});

// URL API mail.tm untuk mendapatkan pesan
const mailApiUrl = 'https://api.mail.tm/messages';

let lastMessageId = null;

// Fungsi untuk mengambil detail pesan berdasarkan ID pesan
async function getMessageDetails(messageId) {
    const messageDetailUrl = `https://api.mail.tm/messages/${messageId}`;
    try {
        const response = await axios.get(messageDetailUrl, {
            headers: {
                // Tambahkan header yang diperlukan jika ada, misalnya authorization
                'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpYXQiOjE3MTg3MDExNjcsInJvbGVzIjpbIlJPTEVfVVNFUiJdLCJhZGRyZXNzIjoibmV0cGxpeEBuYXZhbGNhZGV0cy5jb20iLCJpZCI6IjY2NzEzNThlODk3MDRmOWI1NTAzMGE1YiIsIm1lcmN1cmUiOnsic3Vic2NyaWJlIjpbIi9hY2NvdW50cy82NjcxMzU4ZTg5NzA0ZjliNTUwMzBhNWIiXX19.TYwgZdsIqPFFegAc9JsEfczJLFY1Izu2O0lLA4oz0hK1UNwo1lgfskatWVErdDRnkogqX3i0QI0EQyp7aFEm5'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching message details:', error);
        return null;
    }
}

// Fungsi untuk mengambil pesan dari API dan mengirim notifikasi Telegram
async function checkMessages() {
    try {
        const response = await axios.get(mailApiUrl, {
            headers: {
                // Tambahkan header yang diperlukan jika ada, misalnya authorization
                'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpYXQiOjE3MTg3MDExNjcsInJvbGVzIjpbIlJPTEVfVVNFUiJdLCJhZGRyZXNzIjoibmV0cGxpeEBuYXZhbGNhZGV0cy5jb20iLCJpZCI6IjY2NzEzNThlODk3MDRmOWI1NTAzMGE1YiIsIm1lcmN1cmUiOnsic3Vic2NyaWJlIjpbIi9hY2NvdW50cy82NjcxMzU4ZTg5NzA0ZjliNTUwMzBhNWIiXX19.TYwgZdsIqPFFegAc9JsEfczJLFY1Izu2O0lLA4oz0hK1UNwo1lgfskatWVErdDRnkogqX3i0QI0EQyp7aFEm5'
            }
        });
        const messages = response.data['hydra:member'];

        if (messages && messages.length > 0) {
            const latestMessage = messages[0];

            if (latestMessage.id !== lastMessageId) {
                lastMessageId = latestMessage.id;

                // Ambil detail pesan
                const messageDetails = await getMessageDetails(latestMessage.id);
                if (messageDetails) {
                    // Periksa apakah teks pesan ada
                    const text = messageDetails.text;
                    if (text) {
                        // Regular expression untuk mencari URL yang diinginkan
                        const urlRegex = /(https:\/\/www\.netflix\.com\/account\/travel\/verify\?nftoken=[^\s]+)/;

                        // Mencocokkan regex dengan teks
                        const match = text.match(urlRegex);

                        let notificationText = `
                        Pesan Baru!
                        ID: ${latestMessage.id}
                        Dari: ${latestMessage.from.address}
                        Subjek: ${latestMessage.subject}
                        `;

                        if (match) {
                            notificationText += `\nURL Netflix: ${match[0]}`;
                        }

                        // Kirim notifikasi ke Telegram
                        bot.sendMessage(chatId, notificationText);
                    } else {
                        console.error('Pesan tidak memiliki teks.');
                    }
                }
            }
        } else {
            console.log('Tidak ada pesan ditemukan.');
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

// Cek pesan setiap 30 detik
setInterval(checkMessages, 8000);