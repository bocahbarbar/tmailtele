const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const puppeteer = require("puppeteer");


const config = {
    chromePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    telegramToken: '6340014452:AAFNnMkAquX-VsUnSDXMHZC4SLrfiNwVi1M',
    chatId: '782106563',
    token: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpYXQiOjE3MTkwMjM3MTAsInJvbGVzIjpbIlJPTEVfVVNFUiJdLCJhZGRyZXNzIjoic3BhbW5ldGZsaXhAbmF2YWxjYWRldHMuY29tIiwiaWQiOiI2NjcyMTZjNTBkYzcxMDZlOGMwYTI1ZDQiLCJtZXJjdXJlIjp7InN1YnNjcmliZSI6WyIvYWNjb3VudHMvNjY3MjE2YzUwZGM3MTA2ZThjMGEyNWQ0Il19fQ.UoXUaDVk3OU-Tyfa-VLbdDfKDfYH9b_7rpINs0YVtYqcASFl7oN9jzqC6vmwAXr37y6n5NvSVeNPFsHpg_ZCaQ'
};

const bot = new TelegramBot(config.telegramToken, {
    polling: true
});


// URL API mail.tm untuk mendapatkan pesan
const mailApiUrl = 'https://api.mail.tm/messages';

let lastMessageId = null;


async function OpenNetflix(url, notificationText) {



    // Launch browser
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: config.chromePath,
        args: ["--incognito"],
    });

    // Open a new page
    const page = await browser.newPage();

    // Function to extract data from the verify page
    const extractData = async (page) => {
        try {
            await page.waitForSelector(
                "#appMountPoint > div > div > div > div.bd > div > div > div > div.challenge-code", {
                    timeout: 5000
                }
            );

            const data = await page.evaluate(() => {
                const element = document.querySelector(
                    "#appMountPoint > div > div > div > div.bd > div > div > div > div.challenge-code"
                );
                return element ? element.innerText : null;
            });

            console.log("Data:", data);
            notificationText += `\nKode Netflix: ${data}`;
            bot.sendMessage(config.chatId, notificationText);
            // bot.sendMessage(config.chatId, data);
        } catch (error) {
            console.error("Error:", error.message);
        }

    };

    // Function to click the button on the update location page
    const clickButton = async (page) => {
        try {
            await page.waitForSelector(
                "#appMountPoint > div > div > div > div.bd > div > div > div > div:nth-child(5) > button", {
                    timeout: 5000
                }
            );

            await page.click(
                "#appMountPoint > div > div > div > div.bd > div > div > div > div:nth-child(5) > button"
            );
            console.log("Button clicked");
        } catch (error) {
            console.error("Error:", error.message);
        }
    };

    // Navigate to the URL and perform the appropriate action
    await page.goto(url, {
        waitUntil: "domcontentloaded",
    });

    if (url.includes("/account/travel/verify")) {
        await extractData(page);
    } else if (url.includes("/account/update-primary-location")) {
        await clickButton(page);
    }

    // Close the browser
    await browser.close();


}
// Fungsi untuk mengambil detail pesan berdasarkan ID pesan
async function getMessageDetails(messageId) {
    const messageDetailUrl = `https://api.mail.tm/messages/${messageId}`;
    try {
        const response = await axios.get(messageDetailUrl, {
            headers: {
                // Tambahkan header yang diperlukan jika ada, misalnya authorization
                'Authorization': `${config.token}`
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
                'Authorization': `${config.token}`
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
                        Pesan Baru!\nID: ${latestMessage.id}\nDari: ${latestMessage.to[0].address}\nSubjek: ${latestMessage.subject}
                        `;

                        if (match) {
                            // const uurl = match[0]

                            await OpenNetflix(match[0], notificationText)
                            // console.log(kode)
                        }

                        // Kirim notifikasi ke Telegram
                        // bot.sendMessage(config.chatId, notificationText);
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