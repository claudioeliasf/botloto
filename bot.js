const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require('qrcode');
const schedule = require("node-schedule");
const XLSX = require("xlsx");
const fs = require("fs");
const puppeteer = require('puppeteer');
const moment = require("moment-timezone");
const path = require('path');
const express = require('express');

// Configura o fuso horário para o horário de Brasília
moment.tz.setDefault("America/Sao_Paulo");

// Caminhos dos arquivos
const PALPITE_PATH = path.join(__dirname, 'palpite_do_dia.json');
const RESULTADO_PATH = path.join(__dirname, 'resultado_oficial.json');
const ID_DO_GRUPO = "120363405138306489@g.us"; // ID do grupo "Ganhe Muito na Loteria"
const CAMINHO_ARQUIVO = path.join(__dirname, 'historico_lotofacil.xlsx'); // Caminho do arquivo de histórico

// Configuração do Express para servir o QR Code
const app = express();
const PORT = process.env.PORT || 3000; // Porta para o Fly.io (alterada para 3000)
app.use(express.static(path.join(__dirname)));

// Rota para exibir o QR Code
app.get("/", (req, res) => {
    const qrCodePath = path.join(__dirname, 'qrcode.png');
    if (fs.existsSync(qrCodePath)) {
        res.send(`
            <html>
                <head>
                    <title>QR Code para autenticação</title>
                    <script>
                        // Atualiza a página a cada 5 segundos
                        setTimeout(function() {
                            location.reload();
                        }, 5000);
                    </script>
                </head>
                <body>
                    <h1>QR Code para autenticação</h1>
                    <img src="/qrcode.png" alt="QR Code" />
                    <p>Atualizando automaticamente em 5 segundos...</p>
                </body>
            </html>
        `);
    } else {
        res.send("QR Code ainda não foi gerado. Aguarde...");
    }
});

// Inicializa o servidor Express
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Configuração do WhatsApp Web
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: path.join(__dirname, 'wwebjs_auth') // Usa o diretório persistente
    }),
    puppeteer: {
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
            "--disable-gpu",
            "--remote-debugging-port=9222",
            "--disable-software-rasterizer",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-breakpad",
            "--disable-component-update",
            "--disable-domain-reliability",
            "--disable-features=AudioServiceOutOfProcess",
            "--disable-hang-monitor",
            "--disable-ipc-flooding-protection",
            "--disable-popup-blocking",
            "--disable-prompt-on-repost",
            "--disable-renderer-backgrounding",
            "--disable-sync",
            "--force-color-profile=srgb",
            "--metrics-recording-only",
            "--safebrowsing-disable-auto-update",
            "--enable-automation",
            "--password-store=basic",
            "--use-mock-keychain"
        ],
    },
});

console.log("Configuração do Puppeteer concluída.");

// Exibir QR Code no terminal e salvar como imagem
client.on("qr", qr => {
    console.log("QR Code gerado. Escaneie para autenticar.");
    qrcode.toDataURL(qr, (err, url) => {
        if (err) {
            console.error("Erro ao gerar o QR code:", err);
            return;
        }
        console.log("URL do QR Code:", url);

        // Salva o QR Code como uma imagem
        const base64Data = url.replace(/^data:image\/png;base64,/, "");
        const imagePath = path.join(__dirname, 'qrcode.png');

        fs.writeFile(imagePath, base64Data, 'base64', (err) => {
            if (err) {
                console.error("Erro ao salvar o QR code:", err);
                return;
            }
            console.log("QR Code salvo como qrcode.png.");
        });
    });
});

// Confirmação de que o BOT está online
client.on("ready", () => {
    console.log("BOTLOTO está online!");
    client.sendMessage(ID_DO_GRUPO, "🚀 O BOTLOTO está online e trabalhando para transformar vidas! 🍀✨");
});

// Tratamento de erros
client.on("auth_failure", (msg) => {
    console.error("Falha na autenticação:", msg);
});

// Inicializa o cliente do WhatsApp
client.initialize();