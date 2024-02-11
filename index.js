const {
    default: makeWASocket,
    useMultiFileAuthState,
    downloadMediaMessage
} = require("@whiskeysockets/baileys");
const Pino = require("pino");
const fs = require("fs");
const axios = require("axios");
const ffmpeg = require('fluent-ffmpeg')
const useCODE = true

let creds;
try {
    creds = JSON.parse(fs.readFileSync("./auth/creds.json"));
} catch (err) {
    creds = null;
}

const getBuffer = async (url, options) => {
              	try {
              		options ? options : {}
              		const res = await axios({
              			method: "get",
              			url,
              			headers: {
              				'DNT': 1,
              				'Upgrade-Insecure-Request': 1
              			},
              			...options,
              			responseType: 'arraybuffer'
              		})
              		return res.data
              	} catch (err) {
              		return err
              	}
              }

async function connectToWhatsapp() {
    const auth = await useMultiFileAuthState("auth");
    ////
    let browser;
    if (!creds) {
        browser = useCODE
            ? ["Chrome (Linux)", "", ""]
            : ["Sibay", "Firefox", "1.0.0"];
    } else {
        if (!creds.pairingCode || creds.pairingCode === "") {
            browser = ["Sibay", "Firefox", "1.0.0"];
        } else {
            browser = ["Chrome (Linux)", "", ""];
        }
    }
    console.log(browser);

    const socket = makeWASocket({
        printQRInTerminal: !useCODE,
        browser: browser,
        auth: auth.state,
        logger: Pino({ level: "silent" }),
        generateHighQualityLinkPreview: true
    });
    ////
    if (useCODE && !socket.user && !socket.authState.creds.registered) {
        const question = pertanyaan =>
            new Promise(resolve => {
                const readline = require("readline").createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                readline.question(pertanyaan, answer => {
                    resolve(answer);
                    readline.close();
                });
            });
        const nomorWa = await question("Masukkan nomor whatsapp anda: +");
        setTimeout(async function () {
            const pairingCode = await socket.requestPairingCode(nomorWa);
            console.log("Pairing code anda: ", pairingCode);
        }, 3000);
    }
    socket.ev.on("creds.update", auth.saveCreds);
    socket.ev.on("connection.update", ({ connection }) => {
        if (connection === "open")
            console.log(
                "Nomor WA Yang Terhubung: " + socket.user.id.split(":")[0]
            );
        if (connection === "close") connectToWhatsapp();
    });
    socket.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        function reply(text) {
            socket.sendMessage(
                msg.key.remoteJid,
                { text: text },
                { quoted: msg }
            );
        }
        /* Menambahkan switch case command */
        /*console.log(msg);*/
        if (!msg.message) return;
        const msgType = Object.keys(msg.message)[0];
        const msgText =
            msgType === "conversation"
                ? msg.message.conversation
                : msgType === "extendedTextMessage"
                ? msg.message.extendedTextMessage.text
                : msgType === "imageMessage"
                ? msg.message.imageMessage.caption
                : "";
        if (!msgText.startsWith(".")) return;
        console.log(`Message Type: ${msgType}\nMessage Text: ${msgText}`);
        const command = msgText.replace(/^\./g, "");
        console.log(`Command: ${command}`);
        const id = msg.key.remoteJid;

        switch (command.toLowerCase()) {
            case "steal": 
              // const buffer = await downloadMediaMessage(
              //   msg,
              //   "buffer",
              //   {},
              //   {logger: Pino}
              // )
              
              // const media = await downloadMediaMessage(msg.message.extendedTextMessage.contextInfo)
              
              const imageMessage = await msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage || msg.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage || msg.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage || msg.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.videoMessage
              
              const fake = {
                key: {
                  remoteJid: '6285701449359@s.whatsapp.net',
                  fromMe: true,
                  id: 'E27FB83CC23B9DB0B87E75D8348368C6',
                  participant: undefined
                },
                messageTimestamp: 1707661850,
                pushName: 'gilangf3000',
                broadcast: false,
                status: 2,
                message:{
                  imageMessage: imageMessage
                }
              }
              // const media = await downloadMediaMessage({
              //     message: {
              //         imageMessage: imageMessage
              //     } 
              // })
            //                 console.log({
            //       message: {
            //           imageMessage: imageMessage
            //       } 
            // });




              // let encmedia = await socket.sendImageAsSticker(id, media, msg, { packname: 'fdd', author: 'fdcc'})
              
             // const media = await downloadMediaMessage(await msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage.url)
              
              const buffer = await downloadMediaMessage(fake, 'buffer', {},{logger: Pino})
              //const buffer = getBuffer('https://mmg.whatsapp.net/v/t62.7118-24/34790939_1605056080311351_2731416662183410014_n.enc?ccb=11-4&oh=01_AdR2Ou9a95-EHFTtJBhprHI79Mgxt7wrqi_ilGohd7zwLw&oe=65F01244&_nc_sid=5e03e0&mms3=true')
              console.log(buffer)
              
              fs.writeFileSync('./steal.jpg', buffer)
              socket.sendMessage(
                    id,
                    { image: { url: "./steal.jpg" }, mimeType: "image/jpg" },
                    { quoted: msg }
                );
               
              break
        }
    });
}

connectToWhatsapp();
