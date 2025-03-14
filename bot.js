const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require('qrcode');
const schedule = require("node-schedule");
const XLSX = require("xlsx");
const fs = require("fs");
const puppeteer = require('puppeteer');
const moment = require("moment-timezone");
const path = require('path');
const express = require('express');

// Caminhos dos arquivos
const PALPITE_PATH = path.join(__dirname, 'palpite_do_dia.json');
const RESULTADO_PATH = path.join(__dirname, 'resultado_oficial.json');
const ID_DO_GRUPO = "120363405138306489@g.us"; // ID do grupo "Ganhe Muito na Loteria"
const CAMINHO_ARQUIVO = path.join(__dirname, 'historico_lotofacil.xlsx'); // Caminho do arquivo de histórico

// Mensagens motivacionais
const mensagensMotivacionais = [
    "Bom dia! Hoje será um dia de grandes vitórias! Fique atento, pois às 08:00 traremos 10 palpites que podem mudar sua vida! 🍀🚀",
    "A sorte favorece os persistentes! Fique ligado às 08:00 para os melhores palpites do dia! 💰✨",
    "Acredite! Hoje pode ser o seu dia de sorte! Em breve, às 08:00, traremos números poderosos para você apostar 🎯🔥"
];

// Configuração do Express para servir o QR Code
const app = express();
const PORT = process.env.PORT || 10000; // Porta para o Render
app.use(express.static(path.join(__dirname)));

// Rota para exibir o QR Code
app.get("/", (req, res) => {
    const qrCodePath = path.join(__dirname, 'qrcode.png');
    if (fs.existsSync(qrCodePath)) {
        res.sendFile(qrCodePath); // Serve o QR Code como imagem
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
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--remote-debugging-port=9222'
        ],
        executablePath: process.env.CHROMIUM_PATH || puppeteer.executablePath(), // Usa o Chromium do Render
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    }
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
        console.log("URL do QR Code:", url); // Exibe a URL do QR Code no terminal

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

// Caminho do áudio de boas-vindas
const AUDIO_PATH = path.join(__dirname, "audios", "boas_vindas.mp3");

if (!AUDIO_PATH) {
    console.error("AUDIO_PATH não está definido.");
} else if (!fs.existsSync(AUDIO_PATH)) {
    console.error(`Arquivo de áudio não encontrado: ${AUDIO_PATH}`);
} else {
    console.log("Arquivo de áudio encontrado:", AUDIO_PATH);
}

// Caminho do arquivo para salvar os contatos
const CONTATOS_PATH = path.join(__dirname, "contatos.json");

// Lista de usuários que já receberam o áudio e a mensagem
let usuariosNotificados = new Set();

// Carrega os contatos salvos (se existirem)
if (fs.existsSync(CONTATOS_PATH)) {
    const contatosSalvos = fs.readFileSync(CONTATOS_PATH, "utf-8");
    usuariosNotificados = new Set(JSON.parse(contatosSalvos));
}

// Função para enviar áudio e mensagem de boas-vindas
async function enviarBoasVindas(usuario) {
    if (!usuario) {
        console.error("Usuário não definido.");
        return;
    }

    if (usuariosNotificados.has(usuario)) {
        console.log(`Usuário ${usuario} já recebeu o áudio e a mensagem. Ignorando...`);
        return;
    }

    try {
        console.log(`Enviando áudio e mensagem para ${usuario}...`);

        // Carrega o arquivo de áudio
        const audio = MessageMedia.fromFilePath(AUDIO_PATH);
        console.log("Áudio carregado com sucesso.");

        // Envia o áudio para o usuário
        await client.sendMessage(usuario, audio, { sendAudioAsVoice: true });
        console.log(`Áudio de boas-vindas enviado para ${usuario}`);

        // Mensagem de texto
        const mensagem = `
🔍 *O que eu faço para te levar ao sucesso?*

Eu analiso todos os sorteios anteriores e aplico diversas estratégias matemáticas para encontrar os melhores números. Entre elas:

✅ *Frequência e atraso dos números* – Identifica padrões ocultos nos sorteios passados.
✅ *Análise de Monte Carlo* – Utiliza simulações para prever combinações mais prováveis.
✅ *Distribuição equilibrada* – Gero apostas estratégicas para cobrir as melhores chances.
✅ *Método Fibonacci e múltiplos de 3* – Incorporação lógica matemática para refinar suas apostas.
✅ *Personalização Total* – No *BOTLOTO PLUS*, suas apostas serão adaptadas ao seu perfil e estratégia preferida.
✅ *Probabilidade Condicional (Teorema de Bayes)* – Análise avançada para prever resultados.
✅ *Análise Combinatória e Cobertura de Apostas* – Maximiza as chances de acerto.
✅ *Inteligência Artificial e Machine Learning* – Utiliza redes neurais artificiais, algoritmos genéticos, regressão logística e árvores de decisão.

💰 *Quais são suas chances?*

Nada aqui é baseado em suposição! Minhas análises já mostraram que, com um bom planejamento e a estratégia certa, é possível aumentar significativamente a taxa de acertos. Quem já usou meu sistema viu um crescimento significativo nos acertos de 11, 12, 13 e até 14 pontos!

🎟️ *Muito mais do que apenas palpites!*

No *BOTLOTO PLUS*, você terá controle total sobre suas apostas, podendo escolher entre:

🔹 *Palpites conservadores, moderados e agressivos* – Adaptando sua estratégia ao seu perfil.
🔹 *Salvar e criar seus próprios palpites* – Garantindo total personalização.
🔹 *Gerar palpites para bolões* – Aumentando suas chances em grupo.
🔹 *Solicitar palpites com 16, 17, 18, 19 e até 20 números* – Ampliando suas possibilidades de acerto.
🔹 *Simular seus investimentos* – Sabendo exatamente quanto apostar e quanto poderá receber em caso de vitória.

Tudo isso em um mega sistema 100% digital, feito para quem deseja um dia viver como milionário, com qualidade de vida e segurança financeira.

🚀 *A revolução na Lotofácil está chegando!*

Fique atento, porque sua chance de mudar de vida pode estar mais perto do que você imagina.

📢 *Em breve, abriremos as vagas para o BOTLOTO PLUS.*

Você será um dos primeiros a ter a oportunidade de fazer parte dessa elite de apostadores inteligentes.

Vamos juntos em busca dos 15 pontos! 🔥
        `;

        // Envia a mensagem de texto
        await client.sendMessage(usuario, mensagem);
        console.log(`Mensagem de boas-vindas enviada para ${usuario}`);

        // Adiciona o usuário à lista de notificados
        usuariosNotificados.add(usuario);

        // Salva a lista de contatos no arquivo
        fs.writeFileSync(CONTATOS_PATH, JSON.stringify([...usuariosNotificados]), "utf-8");
        console.log(`Contato ${usuario} salvo com sucesso.`);
    } catch (error) {
        console.error(`Erro ao enviar áudio/mensagem para ${usuario}:`, error.message);
    }
}

// Quando o bot recebe uma mensagem
client.on("message", async (message) => {
    const mensagemRecebida = message.body.toLowerCase(); // Converte a mensagem para minúsculas
    const isPrivado = !message.from.includes('@g.us'); // Verifica se a mensagem é no privado
    const isGrupo = message.from.includes('@g.us'); // Verifica se a mensagem é no grupo

    // Responde ao comando "botloto" no grupo ou no privado
    if (mensagemRecebida === "botloto") {
        try {
            const usuario = isGrupo ? message.author : message.from; // ID do usuário
            await client.sendMessage(usuario, "Estou funcionando perfeitamente! 🚀");
            console.log(`Comando "botloto" recebido ${isGrupo ? 'no grupo' : 'no privado'}.`);
        } catch (error) {
            console.error("❌ Erro ao processar o comando 'botloto':", error.message);
        }
    }

    // Comando para disparo em massa
    if (isPrivado && mensagemRecebida.startsWith("!disparo!")) {
        try {
            // Extrai a mensagem a ser disparada (remove o comando "!disparo!")
            const mensagemDisparo = mensagemRecebida.replace("!disparo!", "").trim();

            // Verifica se a mensagem não está vazia
            if (mensagemDisparo === "") {
                await message.reply("❌ Por favor, escreva a mensagem após o comando !disparo!.");
                return;
            }

            // Confirmação para o usuário
            await message.reply(`✅ Mensagem registrada para disparo em massa:\n\n"${mensagemDisparo}"`);

            // Dispara a mensagem em massa
            await dispararMensagemEmMassa(mensagemDisparo);
            console.log(`Mensagem em massa disparada: "${mensagemDisparo}"`);
        } catch (error) {
            console.error("❌ Erro ao processar o comando !disparo!:", error.message);
            await message.reply("❌ Ocorreu um erro ao processar seu comando. Tente novamente.");
        }
    }
});

// Função para disparar mensagens em massa
async function dispararMensagemEmMassa(mensagem) {
    for (const usuario of usuariosNotificados) {
        try {
            await client.sendMessage(usuario, mensagem);
            console.log(`Mensagem enviada para ${usuario}`);
            await delay(1000); // Aguarda 1 segundo entre cada envio
        } catch (error) {
            console.error(`Erro ao enviar mensagem para ${usuario}:`, error.message);
        }
    }
}

// Função para adicionar um delay (evitar bloqueios do WhatsApp)
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Mensagem de boas-vindas ao grupo
client.on("group_join", async (notification) => {
    try {
        console.log("Novo membro entrou no grupo:", notification);

        // Obtém o ID do usuário diretamente da notificação
        const usuario = notification.id.participant;

        // Verifica se o ID do usuário é válido
        if (!usuario) {
            console.error("ID do usuário inválido:", usuario);
            return;
        }

        console.log("ID do usuário:", usuario);

        // Envia a mensagem de boas-vindas no grupo
        const chat = await notification.getChat();
        await chat.sendMessage(`🎉 Bem-vindo, @${usuario.split('@')[0]}! Que a sorte esteja com você! 🍀🚀`, {
            mentions: [usuario]
        });

        // Envia o áudio e a mensagem no privado
        await enviarBoasVindas(usuario);
    } catch (error) {
        console.error("Erro ao processar entrada no grupo:", error);
    }
});

// Função para ler o histórico de sorteios da Lotofácil a partir de um arquivo XLS
function lerHistoricoXLS(caminho) {
    if (!fs.existsSync(caminho)) {
        console.error("❌ Erro: Arquivo de histórico não encontrado!");
        return [];
    }
    const workbook = XLSX.readFile(caminho);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet);
}

// Função para obter os números mais frequentes
function obterNumerosFrequentes(dados, quantidade) {
    let contagem = {};
    dados.forEach(sorteio => {
        Object.values(sorteio).forEach(num => {
            contagem[num] = (contagem[num] || 0) + 1;
        });
    });
    return Object.entries(contagem)
        .sort((a, b) => b[1] - a[1])
        .slice(0, quantidade)
        .map(([num]) => parseInt(num));
}

// Função para gerar jogos aleatórios com base em Monte Carlo
function gerarJogoMonteCarlo(dados) {
    let numerosSorteados = new Set();
    while (numerosSorteados.size < 15) {
        let sorteioAleatorio = dados[Math.floor(Math.random() * dados.length)];
        let numerosSorteio = Object.values(sorteioAleatorio)
            .map(n => parseInt(n))
            .filter(n => n >= 1 && n <= 25); // Filtra apenas números válidos (1 a 25)
        
        if (numerosSorteio.length > 0) {
            let numAleatorio = numerosSorteio[Math.floor(Math.random() * numerosSorteio.length)];
            numerosSorteados.add(numAleatorio);
        }
    }
    return Array.from(numerosSorteados).sort((a, b) => a - b);
}

// Função para gerar palpites
function gerarPalpites() {
    const historico = lerHistoricoXLS(CAMINHO_ARQUIVO);
    if (historico.length === 0) {
        console.error("❌ Erro: Histórico insuficiente para gerar palpites!");
        return [];
    }

    let numerosFrequentes = obterNumerosFrequentes(historico, 20);
    let palpites = [];
    
    // Gera 5 palpites com base nos números mais frequentes
    for (let i = 0; i < 5; i++) {
        let jogo = new Set();
        while (jogo.size < 15) {
            let num = numerosFrequentes[Math.floor(Math.random() * numerosFrequentes.length)];
            if (num >= 1 && num <= 25) { // Garante que o número está no intervalo válido
                jogo.add(num);
            }
        }
        palpites.push(Array.from(jogo).sort((a, b) => a - b));
    }

    // Gera 5 palpites com base no método Monte Carlo
    for (let i = 0; i < 5; i++) {
        let jogoMonteCarlo = gerarJogoMonteCarlo(historico);
        palpites.push(jogoMonteCarlo);
    }

    // Salva os palpites no arquivo
    fs.writeFileSync(PALPITE_PATH, JSON.stringify(palpites, null, 2), "utf-8");
    console.log("✅ Palpites gerados e salvos.");
    return palpites;
}

// Função para carregar palpites salvos
function carregarPalpite() {
    if (fs.existsSync(PALPITE_PATH)) {
        return JSON.parse(fs.readFileSync(PALPITE_PATH, "utf-8"));
    }
    return [];
}

// Função para carregar o resultado oficial
function carregarResultado() {
    if (fs.existsSync(RESULTADO_PATH)) {
        return fs.readFileSync(RESULTADO_PATH, "utf-8").split(", ").map(Number);
    }
    return [];
}

// Mensagens de ganho
const mensagensGanho = [
    "🎉 Hoje foi um dia de grandes vitórias! Amanhã, às 8h, teremos mais palpites em busca dos 15 números! 🚀🍀",
    "🌟 Você está mais perto do grande prêmio! Não perca os novos palpites amanhã às 8h. Vamos buscar os 15 números! 💰✨",
    "🔥 Hoje foi um dia de sorte! Amanhã, às 8h, teremos mais palpites para continuar rumo aos 15 números! 🎯🍀"
];

// Mensagens de perda
const mensagensPerda = [
    "😊 Amanhã teremos novos palpites às 8h. A persistência é a chave para a grande vitória! 💪🍀",
    "🔄 O jogo continua! Amanhã, às 8h, teremos mais palpites em busca dos 15 números. Continue tentando! 🍀🚀",
    "✨ Amanhã é um novo dia! Novos palpites estarão disponíveis às 8h. Vamos juntos em busca dos 15 números! 💫🍀"
];

// Função para conferir palpites
function conferirPalpites() {
    let resultado = carregarResultado();
    let palpites = carregarPalpite();
    if (resultado.length === 0 || palpites.length === 0) {
        console.log("⚠️ Resultado ou palpites não encontrados.");
        return "⚠️ Resultado ou palpites não encontrados.";
    }

    let relatorio = palpites.map((palpite, index) => {
        let acertos = palpite.filter(num => resultado.includes(num)).length;
        let simbolo = acertos >= 11 ? "🟢" : "❌"; // Bandeira verde para 11+ acertos, X vermelho para menos
        return `🎯 Jogo ${index + 1}: [${palpite.join(", ")}]\nAcertos: ${acertos} ${simbolo}`;
    }).join("\n\n");

    // Verifica se houve algum ganho (11 ou mais acertos)
    let houveGanho = palpites.some(palpite => {
        return palpite.filter(num => resultado.includes(num)).length >= 11;
    });

    // Escolhe uma mensagem de ganho ou perda aleatoriamente
    let mensagemFinal;
    if (houveGanho) {
        mensagemFinal = mensagensGanho[Math.floor(Math.random() * mensagensGanho.length)];
    } else {
        mensagemFinal = mensagensPerda[Math.floor(Math.random() * mensagensPerda.length)];
    }

    return `📊 *Conferência do Resultado Oficial com os Nossos Palpites:*\n\n${relatorio}\n\n${mensagemFinal}`;
}

// Função para buscar o resultado oficial da Lotofácil
async function buscarResultadoLotofacil() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto("https://www.asloterias.com.br/lotofacil", { waitUntil: "networkidle2" });
        await page.waitForSelector(".dezenas.dezenas_lfacil", { timeout: 120000 });
        const dezenas = await page.evaluate(() => {
            return Array.from(document.querySelectorAll(".dezenas.dezenas_lfacil"))
                .map(el => el.innerText.trim());
        });
        const ultimoResultado = dezenas.slice(0, 15).map(Number);
        fs.writeFileSync(RESULTADO_PATH, ultimoResultado.join(", "));
        return ultimoResultado;
    } catch (error) {
        console.error("❌ Erro ao buscar resultado:", error.message);
        return [];
    } finally {
        await browser.close();
    }
}

// Função para enviar o resultado para o grupo
async function enviarResultadoParaGrupo(resultado) {
    try {
        await client.sendMessage(ID_DO_GRUPO, `🎉 *Resultado Oficial da Lotofácil:*\n\n${resultado.join(", ")}`);
        console.log("✅ Resultado enviado para o grupo com sucesso!");
    } catch (error) {
        console.error("❌ Erro ao enviar resultado para o grupo:", error.message);
    }
}

// Função para enviar mensagem para o grupo
async function enviarMensagemGrupo(mensagem) {
    if (!client) {
        console.error("❌ Erro: O cliente não está inicializado.");
        return;
    }
    try {
        await client.sendMessage(ID_DO_GRUPO, mensagem);
        console.log("📩 Mensagem enviada para o grupo com sucesso!");
    } catch (error) {
        console.error("❌ Erro ao enviar mensagem para o grupo:", error.message);
    }
}

// Adicione esta função para verificar se é domingo
function ehDomingo() {
    const hoje = new Date();
    return hoje.getDay() === 0; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
}

// Agendamento de tarefas
client.on("ready", () => {
    console.log("✅ BOTLOTO está pronto! Agendando envios automáticos...");

    // Mensagem de descanso aos domingos às 7h
    schedule.scheduleJob("0 7 * * 0", async () => { // 0 = Domingo
        if (ehDomingo()) {
            const mensagemDescanso = `
Bom dia! 🌞 Como ninguém é de ferro e hoje não tem jogos da loteria, vou pra praia descansar. 🏖️🍹
Amanhã voltarei com energia renovada para deixar você rico! 💰🚀
Até lá, aproveite o domingão! 😎🎉
            `;
            await client.sendMessage(ID_DO_GRUPO, mensagemDescanso);
            console.log("✅ Mensagem de descanso enviada aos domingos.");
        }
    });

    // Mensagem motivacional de segunda a sábado às 7h
    schedule.scheduleJob("0 7 * * 1-6", async () => { // 1-6 = Segunda a Sábado
        const mensagemMotivacional = mensagensMotivacionais[Math.floor(Math.random() * mensagensMotivacionais.length)];
        await enviarMensagemGrupo(mensagemMotivacional);
    });

    // Palpites do dia de segunda a sábado às 8h
    schedule.scheduleJob('0 8 * * 1-6', async () => { // 1-6 = Segunda a Sábado
        console.log('⏰ 8h: Gerando e enviando novos palpites...');
        const novoPalpite = gerarPalpites();
        console.log('✅ Palpites do dia salvos:', novoPalpite);
        
        try {
            let mensagem = `📢 *Palpites do Dia:*\n` +
                novoPalpite.map((jogo, i) => `\n🎲 *Jogo ${i + 1}:* \n➡️ ${jogo.join(", ")}`).join("\n");
            
            await client.sendMessage(ID_DO_GRUPO, mensagem);
            console.log("✅ Palpites enviados com sucesso!");
        } catch (error) {
            console.error("❌ Erro ao enviar palpites para o grupo:", error.message);
        }
    });

    // Mensagem sobre o grupo VIP de segunda a sábado às 15h
    schedule.scheduleJob("0 15 * * 1-6", () => { // 1-6 = Segunda a Sábado
        client.sendMessage(ID_DO_GRUPO, 
        "🚀 *Em breve teremos o grupo VIP!*\n\n" +
        "📊 O que há de mais moderno em análises de jogos para sempre buscarmos a melhor performance.\n" +
        "🤖 Mobilizamos inteligência artificial e todas as análises matemáticas para aumentar suas chances.\n" +
        "🎯 Você poderá personalizar seus palpites, escolher a quantidade de jogos, análises, bolões e muito mais!\n\n" +
        "🔜 *AGUARDE!*"
        );
    });

    // Busca do resultado oficial de segunda a sábado às 21h
    schedule.scheduleJob("0 21 * * 1-6", async () => { // 1-6 = Segunda a Sábado
        console.log("🔍 Buscando o resultado oficial da Lotofácil...AGUARDE");
        await client.sendMessage(ID_DO_GRUPO, "🔍 Buscando o resultado oficial da Lotofácil de hoje...AGUARDE");
    });

    // Captura do resultado oficial de segunda a sábado às 21:01h
    schedule.scheduleJob("1 21 * * 1-6", async () => { // 1-6 = Segunda a Sábado
        console.log("Iniciando captura do resultado da Lotofácil...");
        const dezenas = await buscarResultadoLotofacil();
        if (dezenas.length > 0) {
            console.log("Enviando resultado para o grupo...");
            await enviarResultadoParaGrupo(dezenas);
        }
    });

    // Conferência de palpites de segunda a sábado às 21:02h
    schedule.scheduleJob("2 21 * * 1-6", async () => { // 1-6 = Segunda a Sábado
        console.log("🔎 Conferindo palpites com o resultado oficial...");
        const relatorio = conferirPalpites();
        await client.sendMessage(ID_DO_GRUPO, relatorio); // Envia o relatório ao grupo
        console.log("✅ Relatório de conferência enviado para o grupo.");
    });
});

// Inicializa o cliente do Whats
client.initialize();