import makeWASocket, { useMultiFileAuthState, DisconnectReason, delay, fetchLatestBaileysVersion, Browsers, downloadMediaMessage } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs';
import readline from 'readline';

const ROLES_FILE = './data/roles.json';
const BOTS_FILE = './data/bots.json';
const DELAYS_FILE = './data/delays.json';

const defaultRoles = {
    admins: [],
    subAdmins: {}
};

const generateDefaultDelays = () => {
    const delays = {};
    for (let i = 1; i <= 13; i++) {
        delays[`nc${i}`] = 50;
    }
    for (let i = 1; i <= 30; i++) {
        delays[`large${i}`] = 50;
    }
    return delays;
};

const defaultDelays = generateDefaultDelays();

const CONSTANT_WORDS = [
    'TMR�',
    'CHUTIYA🐯',
    'CHUD🦁',
    'TBKC🐺',
    'TMKC🦊',
    'RANDI🐍',
    'POOR🐢',
    'AUTO WALE🦌',
    'LUN CHUS🐴',
    'MA CHUDA👹',
    'LOFI TERA PAPA🕷️',
    'TMKC ME AALU🦋',
    'CHUDJA🐣'
];

const emojiArrays = {
    nc1: ['❤️','💚','💙','🖤','🤍','💜','💛','🧡','🤎','💖','💗','💓'],
    nc2: ['🐼','🦁','🐯','🐺','🦊','🐍','🐢','🦌','🐴','🦄','🦓','🐪'],
    nc3: ['🌙','⭐','✨','🌟','💫','🔥','⚡','🚀','💎','🎯','🏆','👑'],
    nc4: ['🌸','🌺','🌻','🌷','🌹','🌼','🌿','🍀','🌱','🌳','🌲','🌴'],
    nc5: ['🌍','🌎','🌏','🇮🇳','🇺🇸','🇬🇧','🇯🇵','🇰🇷','🇨🇦','🇦🇺','🇩🇪','🇫🇷'],
    nc6: ['💎','🔥','⚡','🚀','💫','🌟','⭐','✨','🎯','🏆','👑','🔱'],
    nc7: ['🇦🇪','🇦🇩','🇦🇪','🇦🇫','🇦🇬','🇦🇮','🇦🇱','🇦🇲','🇦🇴','🇦🇶','🇦🇷','🇦🇸'],
    nc8: ['🖋️','🖊️','🖍️','🖌️','📐','📏','✂️','🖇️','✏️','✒️','🔏','📝'],
    nc9: ['🦁','🐯','🐺','🦊','🐍','🐢','🦌','🐴','🦄','🦓','🐪','🦏'],
    nc10: ['❤️','💚','💙','🖤','🤍','💜','💛','🧡','🤎','💖','💗','💓'],
    nc11: ['💠','🔷','🔹','💠','🔷','🔹','💠','🔷','🔹','💠','🔶','🔸'],
    nc12: ['🐼','🦁','🐯','🐺','🦊','🐍','🐢','🦌','🐴','🦄','🦓','🐪'],
    nc13: ['🌍','🌎','🌏','🇮🇳','🇺🇸','🇬🇧','🇯🇵','🇰🇷','🇨🇦','🇦🇺','🇩🇪','🇫🇷']
};

const generateLargeNcCombos = () => {
    const combos = {};
    const ncKeys = Object.keys(emojiArrays);
    for (let i = 1; i <= 30; i++) {
        const idx1 = (i - 1) % 13;
        const idx2 = i % 13;
        const idx3 = (i + 1) % 13;
        combos[`large${i}`] = [ncKeys[idx1], ncKeys[idx2], ncKeys[idx3]];
    }
    return combos;
};

const largeNcCombos = generateLargeNcCombos();

const interfaceEmojis = ['❤️','💚','💙','🖤','🤍','💜','🐼','🦁','🐯','🐺','🦊','🚀','⚡','🔥','🌍','🎯','🏆','👑','💎','🔱','🇮🇳','🇺🇸','🇬🇧','🇯🇵'];

const getRandomEmoji = () => interfaceEmojis[Math.floor(Math.random() * interfaceEmojis.length)];

const customFontMap = {
    'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ғ', 'G': 'ɢ',
    'H': 'ʜ', 'I': 'ɪ', 'J': 'ᴊ', 'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ',
    'O': 'ᴏ', 'P': 'ᴘ', 'Q': 'ǫ', 'R': 'ʀ', 'S': 's', 'T': 'ᴛ', 'U': 'ᴜ',
    'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x', 'Y': 'ʏ', 'Z': 'ᴢ',
    'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ',
    'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ',
    'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ', 'u': 'ᴜ',
    'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
    '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', 
    '6': '6', '7': '7', '8': '8', '9': '9',
    ' ': ' ', '.': '.', ',': ',', '!': '!', '?': '?', ':': ':', 
    ';': ';', '(': '(', ')': ')', '[': '[', ']': ']', '{': '{', 
    '}': '}', '@': '@', '#': '#', '$': '$', '%': '%', '^': '^', 
    '&': '&', '*': '*', '-': '-', '_': '_', '=': '=', '+': '+', 
    '|': '|', '\\': '\\', '/': '/', '<': '<', '>': '>', '"': '"', 
    "'": "'", '`': '`', '~': '~'
};

function convertToCustomFont(text) {
    return text.split('').map(char => customFontMap[char] || char).join('');
}

const getReplyMessages = () => ({
    LOFIBot: convertToCustomFont('LOFI bot') + ' ' + getRandomEmoji(),
    largeNcStarted: convertToCustomFont('large nc started') + ' ' + getRandomEmoji(),
    ncStarted: convertToCustomFont('nc started') + ' ' + getRandomEmoji(),
    csStarted: convertToCustomFont('cs nc started') + ' ' + getRandomEmoji(),
    ncStopped: convertToCustomFont('nc stopped') + ' ' + getRandomEmoji(),
    csStopped: convertToCustomFont('cs attack stopped') + ' ' + getRandomEmoji(),
    largeDelaySet: convertToCustomFont('large delay set to') + ' ' + getRandomEmoji(),
    ncDelaySet: convertToCustomFont('nc delay set to') + ' ' + getRandomEmoji(),
    youAreNowAdmin: convertToCustomFont('you are now the admin') + ' ' + getRandomEmoji(),
    youAreAlreadyAdmin: convertToCustomFont('you are already the admin') + ' ' + getRandomEmoji(),
    adminAlreadyExists: convertToCustomFont('admin already exists') + ' ' + getRandomEmoji(),
    youAreNoLongerAdmin: convertToCustomFont('you are no longer an admin') + ' ' + getRandomEmoji(),
    youAreNotAdmin: convertToCustomFont('you are not an admin') + ' ' + getRandomEmoji(),
    subAdminAdded: convertToCustomFont('sub-admin added') + ' ' + getRandomEmoji(),
    alreadySubAdmin: convertToCustomFont('already sub-admin') + ' ' + getRandomEmoji(),
    subAdminRemoved: convertToCustomFont('sub-admin removed') + ' ' + getRandomEmoji(),
    notSubAdmin: convertToCustomFont('not a sub-admin') + ' ' + getRandomEmoji(),
    replyToSomeone: convertToCustomFont('reply to someone') + ' ' + getRandomEmoji(),
    invalidPhone: convertToCustomFont('invalid phone number') + ' ' + getRandomEmoji(),
    useInGroup: convertToCustomFont('use in group') + ' ' + getRandomEmoji(),
    delayTooLow: convertToCustomFont('delay must be >= 50ms') + ' ' + getRandomEmoji(),
    invalidNcNumber: convertToCustomFont('invalid nc number use nc1 to nc13') + ' ' + getRandomEmoji(),
    usage: convertToCustomFont('usage') + ' ' + getRandomEmoji(),
    activeBots: convertToCustomFont('active bots') + ' ' + getRandomEmoji(),
    LOFIStatus: convertToCustomFont('LOFI status') + ' ' + getRandomEmoji(),
    individualNc: convertToCustomFont('individual nc') + ' ' + getRandomEmoji(),
    constantText: convertToCustomFont('constant text') + ' ' + getRandomEmoji(),
    largeAttacks: convertToCustomFont('large attacks') + ' ' + getRandomEmoji(),
    constantTexts: convertToCustomFont('constant texts') + ' ' + getRandomEmoji(),
    LOFIPing: convertToCustomFont('LOFI ping') + ' ' + getRandomEmoji(),
    activeBotsCount: convertToCustomFont('active bots') + ' ' + getRandomEmoji(),
    connected: convertToCustomFont('connected') + ' ' + getRandomEmoji(),
    pairingCode: convertToCustomFont('pairing code') + ' ' + getRandomEmoji(),
    number: convertToCustomFont('number') + ' ' + getRandomEmoji(),
    total: convertToCustomFont('total') + ' ' + getRandomEmoji(),
    pinging: convertToCustomFont('pinging') + ' ' + getRandomEmoji(),
    latency: convertToCustomFont('latency') + ' ' + getRandomEmoji(),
    botCreated: convertToCustomFont('bot created') + ' ' + getRandomEmoji(),
    realLargeAttack: convertToCustomFont('real large attack started') + ' ' + getRandomEmoji(),
    botAlive: convertToCustomFont('LOFI daddy bot alive') + ' ' + getRandomEmoji(),
    picSpamStarted: convertToCustomFont('pic spam started') + ' ' + getRandomEmoji(),
    picSpamStopped: convertToCustomFont('pic spam stopped') + ' ' + getRandomEmoji(),
    spamStarted: convertToCustomFont('spam started') + ' ' + getRandomEmoji(),
    spamStopped: convertToCustomFont('spam stopped') + ' ' + getRandomEmoji(),
    spamLoopStarted: convertToCustomFont('spamloop started') + ' ' + getRandomEmoji(),
    spamLoopStopped: convertToCustomFont('spamloop stopped') + ' ' + getRandomEmoji(),
    swipeStarted: convertToCustomFont('swipe started') + ' ' + getRandomEmoji(),
    swipeStopped: convertToCustomFont('swipe stopped') + ' ' + getRandomEmoji(),
    targetSlideSet: convertToCustomFont('target slide set') + ' ' + getRandomEmoji(),
    targetSlideRemoved: convertToCustomFont('target slide removed') + ' ' + getRandomEmoji(),
    replyToPic: convertToCustomFont('reply to a picture') + ' ' + getRandomEmoji(),
    provideText: convertToCustomFont('provide text') + ' ' + getRandomEmoji(),
    provideNumber: convertToCustomFont('provide number and text') + ' ' + getRandomEmoji()
});

const getRogueMenu = () => {
    const e1 = getRandomEmoji();
    const e2 = getRandomEmoji();
    const e3 = getRandomEmoji();
    const e4 = getRandomEmoji();
    const e5 = getRandomEmoji();
    const e6 = getRandomEmoji();
    const e7 = getRandomEmoji();
    const e8 = getRandomEmoji();
    const e9 = getRandomEmoji();
    const e10 = getRandomEmoji();

    // Auto-detected commands by category
    const commands = {
        general: [
            '~menu → show menu',
            '~ping → check latency',
            '~status → active attacks',
            '~bots → list bots',
            '~botalive → check bot status',
            '~cwords → show constant texts'
        ],
        reactions: [
            '~react [emoji] → react to message',
            '~stopreact → disable reactions'
        ],
        delete_system: [
            '~delet @user → auto delete user messages',
            '~stopdelet @user → stop auto delete'
        ],
        spam_system: [
            '~spam [text] → spam text',
            '~stopspam → stop text spam',
            '~picspam → spam replied image',
            '~stopicspam → stop pic spam',
            '~spamloop [name] → loop spam',
            '~stopspamloop → stop loop spam',
            '~swipe [text] → reply spam',
            '~stopswipe → stop swipe spam'
        ],
        target_commands: [
            '~targetslide [num] [text] → auto reply',
            '~stoptargetslide [num] → stop auto reply'
        ],
        constant_attack: [
            '~cs [text] [nc#] [delay] → constant text attack',
            '~csstop → stop cs attack'
        ],
        large_attacks: [
            '~large1 to ~large30 [text] → large attacks',
            '~ncstop → stop all nc'
        ],
        nc_attacks: [
            '~nc1 to ~nc13 [text] → nc attacks'
        ],
        delay_controls: [
            '~delaync[1-13] [ms] → set nc delay',
            '~delaylarge[1-30] [ms] → set large delay'
        ],
        admin_commands: [
            '~admin → become admin (dm)',
            '~removeadmin → remove admin',
            '~sub → make sub-admin (reply)',
            '~delsub [number] → remove sub-admin',
            '~add [num] → add new bot'
        ]
    };

    const formatCategory = (title, cmds, emoji) => {
        if (cmds.length === 0) return '';
        return `${emoji} ${title} ${emoji}\n${cmds.map(cmd => `  ├ ${cmd}`).join('\n')}\n`;
    };

    return convertToCustomFont(`
╔═══ ┈┈୨୧𝐋𝐨Fɪ୨୧┈ (𝐕ᴏɪᴅ 𝐂ᴏʀᴇ)·̇·̣̇̇·̣̣̇·̣̇̇ ═══╗
║
${formatCategory('GENERAL', commands.general, e2)}
${formatCategory('REACTIONS', commands.reactions, e3)}
${formatCategory('DELETE SYSTEM', commands.delete_system, e4)}
${formatCategory('SPAM SYSTEM', commands.spam_system, e5)}
${formatCategory('TARGET COMMANDS', commands.target_commands, e6)}
${formatCategory('CONSTANT ATTACK', commands.constant_attack, e7)}
${formatCategory('LARGE ATTACKS', commands.large_attacks, e8)}
${formatCategory('NC ATTACKS', commands.nc_attacks, e9)}
${formatCategory('DELAY CONTROLS', commands.delay_controls, e10)}
${formatCategory('ADMIN COMMANDS', commands.admin_commands, e1)}
╚════════════════════╝
💀 Powered by : ̗̀➛⁺‧₊˚ ཐི⋆𝐋𝚘ғi̸⋆ཋྀ ˚₊‧⁺
`);
};

function loadRoles() {
    try {
        if (fs.existsSync(ROLES_FILE)) {
            const data = fs.readFileSync(ROLES_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.log('[ROLES] Using defaults');
    }
    return { ...defaultRoles };
}

function saveRoles(roles) {
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
        fs.writeFileSync(ROLES_FILE, JSON.stringify(roles, null, 2));
    } catch (err) {
        console.error('[ROLES] Error:', err.message);
    }
}

function loadDelays() {
    try {
        if (fs.existsSync(DELAYS_FILE)) {
            const data = fs.readFileSync(DELAYS_FILE, 'utf8');
            return { ...defaultDelays, ...JSON.parse(data) };
        }
    } catch (err) {
        console.log('[DELAYS] Using defaults');
    }
    return { ...defaultDelays };
}

function saveDelays(delays) {
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
        fs.writeFileSync(DELAYS_FILE, JSON.stringify(delays, null, 2));
    } catch (err) {
        console.error('[DELAYS] Error:', err.message);
    }
}

let roles = loadRoles();
let ncDelays = loadDelays();

function isAdmin(jid) {
    return roles.admins.includes(jid);
}

function isSubAdmin(jid, groupJid) {
    return roles.subAdmins[groupJid]?.includes(jid) || false;
}

function hasPermission(jid, groupJid) {
    return isAdmin(jid) || isSubAdmin(jid, groupJid);
}

function addAdmin(jid) {
    if (!roles.admins.includes(jid)) {
        roles.admins.push(jid);
        saveRoles(roles);
        return true;
    }
    return false;
}

function removeAdmin(jid) {
    const index = roles.admins.indexOf(jid);
    if (index > -1) {
        roles.admins.splice(index, 1);
        saveRoles(roles);
        return true;
    }
    return false;
}

function addSubAdmin(jid, groupJid) {
    if (!roles.subAdmins[groupJid]) {
        roles.subAdmins[groupJid] = [];
    }
    if (!roles.subAdmins[groupJid].includes(jid)) {
        roles.subAdmins[groupJid].push(jid);
        saveRoles(roles);
        return true;
    }
    return false;
}

function removeSubAdmin(jid, groupJid) {
    if (roles.subAdmins[groupJid]) {
        const index = roles.subAdmins[groupJid].indexOf(jid);
        if (index > -1) {
            roles.subAdmins[groupJid].splice(index, 1);
            saveRoles(roles);
            return true;
        }
    }
    return false;
}

function removeSubAdminByNumber(phoneNumber) {
    const targetJid = phoneNumber.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    let removed = false;
    
    Object.keys(roles.subAdmins).forEach(groupJid => {
        const index = roles.subAdmins[groupJid].indexOf(targetJid);
        if (index > -1) {
            roles.subAdmins[groupJid].splice(index, 1);
            removed = true;
        }
    });
    
    if (removed) {
        saveRoles(roles);
    }
    return removed;
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

class CommandBus {
    constructor() {
        this.botSessions = new Map();
        this.processedMessages = new Map();
    }

    registerBot(botId, session) {
        this.botSessions.set(botId, session);
    }

    unregisterBot(botId) {
        this.botSessions.delete(botId);
    }

    shouldProcessMessage(msgId) {
        if (this.processedMessages.has(msgId)) return false;
        this.processedMessages.set(msgId, Date.now());
        return true;
    }

    async broadcastCommand(commandType, data, originBotId, sendConfirmation = true) {
        const bots = Array.from(this.botSessions.values()).filter(b => b.connected);
        
        for (const bot of bots) {
            try {
                const isOrigin = bot.botId === originBotId;
                await bot.executeCommand(commandType, data, isOrigin && sendConfirmation);
            } catch (err) {
                console.error(`[${bot.botId}] Error:`, err.message);
            }
        }
    }

    getAllBots() {
        return Array.from(this.botSessions.values());
    }

    getConnectedBots() {
        return Array.from(this.botSessions.values()).filter(b => b.connected);
    }

    getLeaderBot() {
        const connected = this.getConnectedBots();
        return connected.length > 0 ? connected[0] : null;
    }
}

class BotSession {
    constructor(botId, phoneNumber, botManager, requestingJid = null) {
        this.botId = botId;
        this.phoneNumber = phoneNumber;
        this.botManager = botManager;
        this.requestingJid = requestingJid;
        this.sock = null;
        this.connected = false;
        this.botNumber = null;
        this.authPath = `./auth/${botId}`;
        this.pairingCodeRequested = false;
        
        this.activeNameChanges = new Map();
        this.activeLargeNc = new Map();
        this.activeConstantAttacks = new Map();
        this.activePicSpam = new Map();
        this.activeTextSpam = new Map();
        this.activeSpamLoop = new Map();
        this.activeSwipeSpam = new Map();
        this.targetSlides = new Map();
        this.activeReactions = new Map();
        this.autoDeleteUsers = new Map();
    }

    async connect() {
        try {
            if (!fs.existsSync(this.authPath)) {
                fs.mkdirSync(this.authPath, { recursive: true });
            }

            const { state, saveCreds } = await useMultiFileAuthState(this.authPath);
            const { version } = await fetchLatestBaileysVersion();
            
            const needsPairing = !state.creds.registered;

            this.sock = makeWASocket({
                auth: state,
                logger: pino({ level: 'silent' }),
                browser: Browsers.macOS('Chrome'),
                version,
                printQRInTerminal: false,
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 0,
                keepAliveIntervalMs: 30000
            });

            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect } = update;
                const replyMessages = getReplyMessages();

                if (needsPairing && this.phoneNumber && !this.pairingCodeRequested && !state.creds.registered) {
                    this.pairingCodeRequested = true;
                    await delay(2000);
                    try {
                        const code = await this.sock.requestPairingCode(this.phoneNumber);
                        console.log(`[${this.botId}] Pairing code: ${code}`);
                        
                        if (this.requestingJid) {
                            const connectedBots = this.botManager.commandBus.getConnectedBots();
                            if (connectedBots.length > 0) {
                                const firstBot = connectedBots[0];
                                await firstBot.sock.sendMessage(this.requestingJid, {
                                    text: `${replyMessages.LOFIBot}\n\n${replyMessages.pairingCode} ${code}\n\n${replyMessages.number} ${this.phoneNumber}`
                                });
                            }
                        } else {
                            console.log(`\n${replyMessages.LOFIBot}`);
                            console.log(`${replyMessages.pairingCode} ${code}`);
                            console.log(`${replyMessages.number} ${this.phoneNumber}\n`);
                        }
                    } catch (err) {
                        console.error(`[${this.botId}] Error getting pairing code:`, err.message);
                        this.pairingCodeRequested = false;
                    }
                }

                if (connection === 'close') {
                    const statusCode = (lastDisconnect?.error instanceof Boom)
                        ? lastDisconnect.error.output.statusCode
                        : 500;

                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                    
                    console.log(`[${this.botId}] Connection closed. Status: ${statusCode}`);
                    this.connected = false;

                    if (shouldReconnect) {
                        console.log(`[${this.botId}] Reconnecting in 5 seconds...`);
                        await delay(5000);
                        this.connect();
                    } else {
                        console.log(`[${this.botId}] Logged out.`);
                        this.botManager.removeBot(this.botId);
                    }
                } else if (connection === 'open') {
                    console.log(`[${this.botId}] ✅ ${replyMessages.connected}`);
                    this.connected = true;
                    this.botNumber = this.sock.user.id.split(':')[0] + '@s.whatsapp.net';
                }
            });

            this.sock.ev.on('creds.update', saveCreds);
            this.sock.ev.on('messages.upsert', async (m) => this.handleMessage(m));

        } catch (err) {
            console.error(`[${this.botId}] Connection error:`, err.message);
        }
    }

    async handleMessage({ messages, type }) {
        try {
            if (type !== 'notify') return;
            
            const msg = messages[0];
            if (!msg.message) return;
            if (msg.key.fromMe) return;
            
            const from = msg.key.remoteJid;
            const isGroup = from.endsWith('@g.us');
            const sender = isGroup ? msg.key.participant : from;
            
            const msgId = msg.key.id;
            const isLeader = this.botManager.commandBus.getLeaderBot()?.botId === this.botId;
            
            if (!isLeader && !this.botManager.commandBus.shouldProcessMessage(msgId)) return;
            if (isLeader && !this.botManager.commandBus.shouldProcessMessage(msgId)) return;
            
            const replyMessages = getReplyMessages();
            
            if (isGroup) {
                const senderNumber = sender.split('@')[0];
                this.targetSlides.forEach(async (targetData, taskId) => {
                    if (taskId.startsWith(from) && targetData.targetNumber === senderNumber && targetData.active) {
                        try {
                            await this.sock.sendMessage(from, { text: targetData.replyText }, { quoted: msg });
                        } catch (err) {
                            console.error(`[${this.botId}] Target slide error:`, err.message);
                        }
                    }
                });

                // Auto-delete logic for users in the list
                if (this.autoDeleteUsers.has(from) && this.autoDeleteUsers.get(from).has(sender)) {
                    try {
                        await this.sock.sendMessage(from, {
                            delete: msg.key
                        });
                        return; // Don't process further commands from this user
                    } catch (err) {
                        console.error(`[${this.botId}] Auto-delete error:`, err.message);
                    }
                }
            }
            
            let text = msg.message.conversation || 
                      msg.message.extendedTextMessage?.text || 
                      msg.message.imageMessage?.caption || '';

            const originalText = text;
            text = text.trim().toLowerCase();

            const isDM = !isGroup;
            const senderIsAdmin = isAdmin(sender);
            const senderIsSubAdmin = isGroup ? isSubAdmin(sender, from) : false;
            const senderHasPermission = senderIsAdmin || senderIsSubAdmin;

            if (isDM && text === '~admin') {
                if (roles.admins.length === 0) {
                    addAdmin(sender);
                    await this.sendMessage(from, `${replyMessages.LOFIBot}\n\n${replyMessages.youAreNowAdmin}`);
                } else if (senderIsAdmin) {
                    await this.sendMessage(from, replyMessages.youAreAlreadyAdmin);
                } else {
                    await this.sendMessage(from, replyMessages.adminAlreadyExists);
                }
                return;
            }

            if (isDM && text === '~removeadmin') {
                if (senderIsAdmin) {
                    removeAdmin(sender);
                    await this.sendMessage(from, replyMessages.youAreNoLongerAdmin);
                } else {
                    await this.sendMessage(from, replyMessages.youAreNotAdmin);
                }
                return;
            }

            if (isGroup && text === '~sub' && senderIsAdmin) {
                if (!msg.message.extendedTextMessage?.contextInfo?.participant) {
                    await this.sendMessage(from, replyMessages.replyToSomeone);
                    return;
                }
                const targetJid = msg.message.extendedTextMessage.contextInfo.participant;
                if (addSubAdmin(targetJid, from)) {
                    await this.sendMessage(from, replyMessages.subAdminAdded, [targetJid]);
                } else {
                    await this.sendMessage(from, replyMessages.alreadySubAdmin);
                }
                return;
            }

            if (isGroup && text === '~removesub' && senderIsAdmin) {
                if (!msg.message.extendedTextMessage?.contextInfo?.participant) {
                    await this.sendMessage(from, replyMessages.replyToSomeone);
                    return;
                }
                const targetJid = msg.message.extendedTextMessage.contextInfo.participant;
                if (removeSubAdmin(targetJid, from)) {
                    await this.sendMessage(from, replyMessages.subAdminRemoved, [targetJid]);
                } else {
                    await this.sendMessage(from, replyMessages.notSubAdmin);
                }
                return;
            }

            if (originalText.toLowerCase().startsWith('~delsub ') && senderIsAdmin) {
                const number = originalText.slice(8).trim().replace(/[^0-9]/g, '');
                if (number.length < 10) {
                    await this.sendMessage(from, replyMessages.invalidPhone);
                    return;
                }
                
                if (removeSubAdminByNumber(number)) {
                    await this.sendMessage(from, replyMessages.subAdminRemoved);
                } else {
                    await this.sendMessage(from, replyMessages.notSubAdmin);
                }
                return;
            }

            if (originalText.toLowerCase().startsWith('~add ') && senderIsAdmin) {
                const number = originalText.slice(5).trim().replace(/[^0-9]/g, '');
                if (number.length < 10) {
                    await this.sendMessage(from, replyMessages.invalidPhone);
                    return;
                }
                
                const result = await this.botManager.addBot(number, from);
                await this.sendMessage(from, result);
                return;
            }

            if (text === '~bots' && senderHasPermission) {
                const bots = this.botManager.commandBus.getAllBots();
                let msgText = `${replyMessages.activeBots}\n\n`;
                msgText += `${replyMessages.total} ${bots.length}\n\n`;
                
                bots.forEach(bot => {
                    const status = bot.connected ? '✅' : '⚠️';
                    msgText += `${bot.botId}: ${status}\n`;
                });
                
                await this.sendMessage(from, msgText);
                return;
            }

            if (text === '~ping' && senderHasPermission) {
                const startTime = Date.now();
                await this.sendMessage(from, `${replyMessages.pinging}`);
                const latency = Date.now() - startTime;
                await this.sendMessage(from, `${replyMessages.LOFIPing}\n\n${replyMessages.latency} ${latency}ᴍs`);
                return;
            }

            if (text === '~botalive' && senderHasPermission) {
                await this.sendMessage(from, replyMessages.botAlive);
                return;
            }

            if (text === '~cwords' && senderHasPermission) {
                let constMsg = `${replyMessages.constantTexts}\n\n`;
                constMsg += `${replyMessages.total} ${CONSTANT_WORDS.length}\n\n`;
                CONSTANT_WORDS.forEach((word, index) => {
                    constMsg += `${index + 1}. ${word}\n`;
                });
                await this.sendMessage(from, constMsg);
                return;
            }

            if (!senderHasPermission) return;

            if (text === '~menu') {
                await this.sock.sendMessage(from, {
                    image: { url: "https://raw.githubusercontent.com/tirupriynka98-crypto/img/main/a_gif_features_the_word_lofi_in_fiery_red_capita.png" },
                    caption: getRogueMenu()
                });
                return;
            }

            if (text === '~picspam') {
                if (!isGroup) {
                    await this.sendMessage(from, replyMessages.useInGroup);
                    return;
                }
                
                const quotedMessage = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
                if (!quotedMessage?.imageMessage) {
                    await this.sendMessage(from, replyMessages.replyToPic);
                    return;
                }
                
                try {
                    const buffer = await downloadMediaMessage(
                        { message: quotedMessage, key: msg.key },
                        'buffer',
                        {},
                        { logger: pino({ level: 'silent' }), reuploadRequest: this.sock.updateMediaMessage }
                    );
                    
                    await this.botManager.commandBus.broadcastCommand('start_pic_spam', { 
                        from, 
                        imageBuffer: buffer 
                    }, this.botId);
                } catch (err) {
                    console.error('Error downloading image:', err);
                    await this.sendMessage(from, replyMessages.replyToPic);
                }
                return;
            }

            if (text === '~stopicspam') {
                if (!isGroup) {
                    await this.sendMessage(from, replyMessages.useInGroup);
                    return;
                }
                await this.botManager.commandBus.broadcastCommand('stop_pic_spam', { from }, this.botId);
                return;
            }

            if (originalText.toLowerCase().startsWith('~spam ')) {
                if (!isGroup) {
                    await this.sendMessage(from, replyMessages.useInGroup);
                    return;
                }
                
                const parts = originalText.split(' ');
                let delayVal = 100;
                let spamText = '';
                
                if (parts.length > 2 && !isNaN(parseInt(parts[1]))) {
                    delayVal = parseInt(parts[1]);
                    spamText = parts.slice(2).join(' ').trim();
                } else {
                    spamText = originalText.slice(6).trim();
                }

                if (!spamText) {
                    await this.sendMessage(from, replyMessages.provideText);
                    return;
                }
                
                await this.botManager.commandBus.broadcastCommand('start_text_spam', { 
                    from, 
                    spamText,
                    delay: delayVal
                }, this.botId);
                return;
            }

            if (text === '~stopspam') {
                if (!isGroup) {
                    await this.sendMessage(from, replyMessages.useInGroup);
                    return;
                }
                await this.botManager.commandBus.broadcastCommand('stop_text_spam', { from }, this.botId);
                return;
            }

            if (text.startsWith('~picspam')) {
                if (!isGroup) {
                    await this.sendMessage(from, replyMessages.useInGroup);
                    return;
                }

                const parts = text.split(' ');
                let delayVal = 100;
                if (parts.length > 1 && !isNaN(parseInt(parts[1]))) {
                    delayVal = parseInt(parts[1]);
                }

                const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage || msg.message.imageMessage;
                if (!quoted) {
                    await this.sendMessage(from, replyMessages.replyToPic);
                    return;
                }

                const imageBuffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: pino({ level: 'silent' }), reuploadRequest: this.sock.updateMediaMessage });
                
                await this.botManager.commandBus.broadcastCommand('start_pic_spam', { 
                    from, 
                    imageBuffer,
                    delay: delayVal
                }, this.botId);
                return;
            }

            if (originalText.toLowerCase().startsWith('~spamloop ')) {
                if (!isGroup) {
                    await this.sendMessage(from, replyMessages.useInGroup);
                    return;
                }
                
                const parts = originalText.split(' ');
                let delayVal = 1000;
                let targetName = '';
                
                if (parts.length > 2 && !isNaN(parseInt(parts[1]))) {
                    delayVal = parseInt(parts[1]);
                    targetName = parts.slice(2).join(' ').trim();
                } else {
                    targetName = parts.slice(1).join(' ').trim();
                }

                if (!targetName) {
                    await this.sendMessage(from, replyMessages.provideText);
                    return;
                }
                
                await this.botManager.commandBus.broadcastCommand('start_spam_loop', { from, targetName, delay: delayVal }, this.botId);
                return;
            }

            if (text === '~stopspamloop') {
                await this.botManager.commandBus.broadcastCommand('stop_spam_loop', { from }, this.botId);
                return;
            }

            if (originalText.toLowerCase().startsWith('~stoptargetslide ')) {
                const targetNumber = originalText.slice(17).trim().replace(/[^0-9]/g, '');
                if (!targetNumber) {
                    await this.sendMessage(from, `${replyMessages.usage} ~stoptargetslide [num]`);
                    return;
                }
                await this.botManager.commandBus.broadcastCommand('remove_target_slide', { from, targetNumber }, this.botId);
                return;
            }

            if (originalText.toLowerCase().startsWith('~swipe ')) {
                if (!isGroup) {
                    await this.sendMessage(from, replyMessages.useInGroup);
                    return;
                }
                
                const quotedMessage = msg.message.extendedTextMessage?.contextInfo;
                if (!quotedMessage?.stanzaId) {
                    await this.sendMessage(from, replyMessages.replyToSomeone);
                    return;
                }
                
                const swipeText = originalText.slice(7).trim();
                if (!swipeText) {
                    await this.sendMessage(from, replyMessages.provideText);
                    return;
                }
                
                await this.botManager.commandBus.broadcastCommand('start_swipe_spam', { 
                    from, 
                    swipeText,
                    quotedMsgId: quotedMessage.stanzaId,
                    quotedParticipant: quotedMessage.participant
                }, this.botId);
                return;
            }

            if (text === '~stopswipe') {
                if (!isGroup) {
                    await this.sendMessage(from, replyMessages.useInGroup);
                    return;
                }
                await this.botManager.commandBus.broadcastCommand('stop_swipe_spam', { from }, this.botId);
                return;
            }

            if (originalText.toLowerCase().startsWith('~react ')) {
                if (!isGroup) {
                    await this.sendMessage(from, replyMessages.useInGroup);
                    return;
                }

                if (!senderHasPermission) {
                    await this.sendMessage(from, replyMessages.youAreNotAdmin);
                    return;
                }

                if (this.activeReactions.get(from) === false) {
                    await this.sendMessage(from, convertToCustomFont('reactions disabled'));
                    return;
                }

                const emoji = originalText.slice(7).trim();
                if (!emoji) {
                    await this.sendMessage(from, `${replyMessages.usage} ~react [emoji]`);
                    return;
                }

                const quotedMessage = msg.message.extendedTextMessage?.contextInfo;
                if (!quotedMessage?.stanzaId) {
                    await this.sendMessage(from, replyMessages.replyToSomeone);
                    return;
                }

                const msgKey = {
                    remoteJid: from,
                    id: quotedMessage.stanzaId,
                    fromMe: false,
                    participant: quotedMessage.participant
                };

                await this.botManager.commandBus.broadcastCommand('react_message', {
                    from,
                    emoji,
                    msgKey
                }, this.botId);
                return;
            }

            if (text === '~stopreact') {
                if (!isGroup) {
                    await this.sendMessage(from, replyMessages.useInGroup);
                    return;
                }

                if (!senderHasPermission) {
                    await this.sendMessage(from, replyMessages.youAreNotAdmin);
                    return;
                }

                await this.botManager.commandBus.broadcastCommand('stop_react', { from }, this.botId);
                await this.sendMessage(from, convertToCustomFont('reactions disabled'));
                return;
            }

            if (originalText.toLowerCase().startsWith('~delet ')) {
                if (!isGroup) {
                    await this.sendMessage(from, replyMessages.useInGroup);
                    return;
                }

                if (!senderHasPermission) {
                    await this.sendMessage(from, replyMessages.youAreNotAdmin);
                    return;
                }

                const mentionedJid = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
                                   msg.message.extendedTextMessage?.contextInfo?.participant;

                if (!mentionedJid) {
                    await this.sendMessage(from, convertToCustomFont('mention a user'));
                    return;
                }

                if (!this.autoDeleteUsers.has(from)) {
                    this.autoDeleteUsers.set(from, new Set());
                }

                this.autoDeleteUsers.get(from).add(mentionedJid);
                await this.sendMessage(from, convertToCustomFont('user added to auto-delete list'));
                return;
            }

            if (originalText.toLowerCase().startsWith('~stopdelet ')) {
                if (!isGroup) {
                    await this.sendMessage(from, replyMessages.useInGroup);
                    return;
                }

                if (!senderHasPermission) {
                    await this.sendMessage(from, replyMessages.youAreNotAdmin);
                    return;
                }

                const mentionedJid = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
                                   msg.message.extendedTextMessage?.contextInfo?.participant;

                if (!mentionedJid) {
                    await this.sendMessage(from, convertToCustomFont('mention a user'));
                    return;
                }

                if (this.autoDeleteUsers.has(from)) {
                    this.autoDeleteUsers.get(from).delete(mentionedJid);
                    if (this.autoDeleteUsers.get(from).size === 0) {
                        this.autoDeleteUsers.delete(from);
                    }
                }

                await this.sendMessage(from, convertToCustomFont('user removed from auto-delete list'));
                return;
            }

            if (originalText.toLowerCase().startsWith('~targetslide ')) {
                if (!isGroup) {
                    await this.sendMessage(from, replyMessages.useInGroup);
                    return;
                }
                
                const args = originalText.slice(13).trim().split(' ');
                if (args.length < 2) {
                    await this.sendMessage(from, replyMessages.provideNumber);
                    return;
                }
                
                const targetNumber = args[0].replace(/[^0-9]/g, '');
                const replyText = args.slice(1).join(' ');
                
                if (targetNumber.length < 10 || !replyText) {
                    await this.sendMessage(from, replyMessages.provideNumber);
                    return;
                }
                
                await this.botManager.commandBus.broadcastCommand('set_target_slide', { 
                    from, 
                    targetNumber,
                    replyText
                }, this.botId);
                return;
            }

            if (text === '~status') {
                const allBots = this.botManager.commandBus.getAllBots();
                let totalName = 0, totalLarge = 0, totalConstant = 0;
                let totalPicSpam = 0, totalTextSpam = 0, totalSwipe = 0, totalTarget = 0, totalAutoDelete = 0;
                
                allBots.forEach(bot => {
                    totalName += bot.activeNameChanges.size;
                    totalLarge += bot.activeLargeNc.size;
                    totalConstant += bot.activeConstantAttacks.size;
                    totalPicSpam += bot.activePicSpam.size;
                    totalTextSpam += bot.activeTextSpam.size;
                    totalSwipe += bot.activeSwipeSpam.size;
                    totalTarget += bot.targetSlides.size;
                    totalAutoDelete += bot.autoDeleteUsers.size;
                });
                
                const statusMsg = `${replyMessages.LOFIStatus}\n\n` +
                                `${convertToCustomFont('individual nc')}: ${totalName}\n` +
                                `${convertToCustomFont('constant text')}: ${totalConstant}\n` +
                                `${convertToCustomFont('large attacks')}: ${totalLarge}\n` +
                                `${convertToCustomFont('pic spam')}: ${totalPicSpam}\n` +
                                `${convertToCustomFont('text spam')}: ${totalTextSpam}\n` +
                                `${convertToCustomFont('swipe spam')}: ${totalSwipe}\n` +
                                `${convertToCustomFont('target slides')}: ${totalTarget}\n` +
                                `${convertToCustomFont('auto delete users')}: ${totalAutoDelete}\n` +
                                `${replyMessages.activeBotsCount}: ${allBots.filter(b => b.connected).length}/${allBots.length}`;
                
                await this.sendMessage(from, statusMsg);
                return;
            }

            if (originalText.toLowerCase().startsWith('~cs ')) {
                const args = originalText.slice(4).trim().split(' ');
                if (args.length < 3) {
                    await this.sendMessage(from, `${replyMessages.usage} ~cs [ᴛᴇxᴛ] [ɴᴄ#] [ᴅᴇʟᴀʏ]`);
                    return;
                }

                const csDelay = parseInt(args[args.length - 1]);
                const ncKey = args[args.length - 2].toLowerCase();
                const userText = args.slice(0, -2).join(' ');

                if (!emojiArrays[ncKey]) {
                    await this.sendMessage(from, replyMessages.invalidNcNumber);
                    return;
                }

                if (isNaN(csDelay) || csDelay < 50) {
                    await this.sendMessage(from, replyMessages.delayTooLow);
                    return;
                }

                if (!isGroup) {
                    await this.sendMessage(from, replyMessages.useInGroup);
                    return;
                }

                await this.botManager.commandBus.broadcastCommand('start_cs', { 
                    from, 
                    userText, 
                    csDelay, 
                    ncKey 
                }, this.botId);
                return;
            }
            else if (text === '~csstop') {
                if (!isGroup) {
                    await this.sendMessage(from, replyMessages.useInGroup);
                    return;
                }
                await this.botManager.commandBus.broadcastCommand('stop_cs', { from }, this.botId);
                return;
            }

            for (let i = 1; i <= 30; i++) {
                const largeKey = `large${i}`;
                if (originalText.toLowerCase().startsWith(`~delay${largeKey} `)) {
                    const delayValue = parseInt(originalText.split(' ')[1]);
                    if (isNaN(delayValue) || delayValue < 50) {
                        await this.sendMessage(from, replyMessages.delayTooLow);
                        return;
                    }
                    
                    ncDelays[largeKey] = delayValue;
                    saveDelays(ncDelays);
                    
                    await this.sendMessage(from, `${replyMessages.largeDelaySet} ${delayValue}ᴍs`);
                    return;
                }
            }

            for (let i = 1; i <= 13; i++) {
                const ncKey = `nc${i}`;
                if (originalText.toLowerCase().startsWith(`~delaync${i} `)) {
                    const delayValue = parseInt(originalText.split(' ')[1]);
                    if (isNaN(delayValue) || delayValue < 50) {
                        await this.sendMessage(from, replyMessages.delayTooLow);
                        return;
                    }
                    
                    ncDelays[ncKey] = delayValue;
                    saveDelays(ncDelays);
                    
                    await this.sendMessage(from, `${replyMessages.ncDelaySet} ${delayValue}ᴍs`);
                    return;
                }
            }

            for (let i = 1; i <= 30; i++) {
                const largeKey = `large${i}`;
                if (originalText.toLowerCase().startsWith(`~${largeKey} `)) {
                    const nameText = originalText.slice(largeKey.length + 2).trim();
                    if (!nameText) {
                        await this.sendMessage(from, `${replyMessages.usage} ~${largeKey} [ᴛᴇxᴛ]`);
                        return;
                    }

                    if (!isGroup) {
                        await this.sendMessage(from, replyMessages.useInGroup);
                        return;
                    }

                    await this.botManager.commandBus.broadcastCommand('start_large_nc', { 
                        from, 
                        nameText, 
                        largeKey 
                    }, this.botId);
                    return;
                }
            }

            for (let i = 1; i <= 13; i++) {
                const ncKey = `nc${i}`;
                if (originalText.toLowerCase().startsWith(`~${ncKey} `)) {
                    const nameText = originalText.slice(ncKey.length + 2).trim();
                    if (!nameText) {
                        await this.sendMessage(from, `${replyMessages.usage} ~${ncKey} [ᴛᴇxᴛ]`);
                        return;
                    }

                    if (!isGroup) {
                        await this.sendMessage(from, replyMessages.useInGroup);
                        return;
                    }

                    await this.botManager.commandBus.broadcastCommand('start_nc', { from, nameText, ncKey }, this.botId);
                    return;
                }
            }

            if (text === '~ncstop') {
                if (!isGroup) {
                    await this.sendMessage(from, replyMessages.useInGroup);
                    return;
                }

                await this.botManager.commandBus.broadcastCommand('stop_nc', { from }, this.botId);
                await this.botManager.commandBus.broadcastCommand('stop_large_nc', { from }, this.botId);
                return;
            }

        } catch (err) {
            console.error(`[${this.botId}] ERROR:`, err);
        }
    }

    async executeCommand(commandType, data, sendConfirmation = true) {
        try {
            const replyMessages = getReplyMessages();
            
            if (commandType === 'start_pic_spam') {
                const { from, imageBuffer } = data;
                const taskId = `${from}_picspam`;
                
                if (this.activePicSpam.has(taskId)) {
                    this.activePicSpam.get(taskId).active = false;
                    await delay(100);
                }
                
                const task = { active: true };
                this.activePicSpam.set(taskId, task);
                
                const runPicSpam = async () => {
                    while (task.active) {
                        try {
                            await this.sock.sendMessage(from, { image: imageBuffer });
                            await delay(data.delay || 100);
                        } catch (err) {
                            await delay(100);
                        }
                    }
                };
                
                runPicSpam();
                
                if (sendConfirmation) {
                    await this.sendMessage(from, replyMessages.picSpamStarted);
                }
            }

            else if (commandType === 'start_spam_loop') {
                const { from, targetName, delay: delayVal } = data;
                const taskId = `${from}_spamloop`;
                
                if (this.activeSpamLoop.has(taskId)) {
                    this.activeSpamLoop.get(taskId).active = false;
                    await delay(100);
                }
                
                const task = { active: true };
                this.activeSpamLoop.set(taskId, task);
                
                const spamContent = `तुम सबका LOFI┈┈୨୧ BAAP H RNDCE SAMJHA___ (${targetName})------🪻तेरी मां की बाचेदानी फाड दुंगा माद्रचोद (${targetName})-------🪻तेरी मां की बाचेदानी फाड दुंगा माद्रचोद (${targetName})-------🪻तेरी मां की बाचेदानी फाड दुंगा माद्रचोद (${targetName})------🪻तेरी मां की बाचेदानी फाड दुंगा माद्रचोद (${targetName})-------🪻तेरी मां की बाचेदानी फाड दुंगा माद्रचोद (${targetName})-------🪻तेरी मां की बाचेदानी फाड दुंगा माद्रचोद (${targetName})------- (${targetName})-------🪻तेरी मां की बाचेदानी फाड दुंगा माद्रचोद (${targetName})-------🪻तेरी मां की बाचेदानी फाड दुंगा माद्रचोद🪻तेरी मां की बाचेदानी फाड दुंगा माद्रचोद (${targetName})-------🪻तेरी मां की बाचेदानी फाड दुंगा माद्रचोद (${targetName})-------🪻तेरी मां की बाचेदानी फाड दुंगा माद्रचोद(${targetName})-------🪻तेरी मां की बाचेदानी फाड दुंगा माद्रचोद (${targetName})-------🪻तेरी मां की बाचेदानी फाड दुंगा माद्रचोद (${targetName})-------🪻तेरी मां की बाचेदानी फाड दुंगा माद्रचोद (${targetName})-------🪻तेरी मां की बाचेदानी फाड दुंगा माद्रचोद (${targetName})-------🪻तेरी मां की बाचेदानी फाड दुंगा माद्रचोद (${targetName})-------🪻तेरी मां की बाचेदानी फाड दुंगा माद्रचोद (${targetName})-------🪻तेरी मां की बाचेदानी फाड दुंगा माद्रचोद (${targetName})-------🪻तेरी मां की बाचेदानी फाड दुंगा माद्रचोद (${targetName})-------🪻तेरी मां की बाचेदानी फाड दुंगा माद्रचोद (${targetName})-------🪻तेरी मां की बाचेदानी फाड दुंगा माद्रचोद`;
                
                const runSpamLoop = async () => {
                    while (task.active) {
                        try {
                            await this.sock.sendMessage(from, { text: spamContent });
                            await delay(delayVal || 1000);
                        } catch (err) {
                            await delay(delayVal || 1000);
                        }
                    }
                };
                
                runSpamLoop();
                
                if (sendConfirmation) {
                    await this.sendMessage(from, replyMessages.spamLoopStarted);
                }
            }

            else if (commandType === 'stop_spam_loop') {
                const { from } = data;
                let stopped = 0;
                
                this.activeSpamLoop.forEach((task, taskId) => {
                    if (taskId.startsWith(from)) {
                        task.active = false;
                        this.activeSpamLoop.delete(taskId);
                        stopped++;
                    }
                });
                
                if (stopped > 0 && sendConfirmation) {
                    await this.sendMessage(from, replyMessages.spamLoopStopped);
                }
            }

            else if (commandType === 'remove_target_slide') {
                const { from, targetNumber } = data;
                const taskId = `${from}_target_${targetNumber}`;
                if (this.targetSlides.has(taskId)) {
                    this.targetSlides.delete(taskId);
                    if (sendConfirmation) {
                        await this.sendMessage(from, replyMessages.targetSlideRemoved);
                    }
                }
            }
            
            else if (commandType === 'stop_pic_spam') {
                const { from } = data;
                let stopped = 0;
                
                this.activePicSpam.forEach((task, taskId) => {
                    if (taskId.startsWith(from)) {
                        task.active = false;
                        this.activePicSpam.delete(taskId);
                        stopped++;
                    }
                });
                
                if (stopped > 0 && sendConfirmation) {
                    await this.sendMessage(from, replyMessages.picSpamStopped);
                }
            }
            
            else if (commandType === 'start_text_spam') {
                const { from, spamText } = data;
                const taskId = `${from}_textspam`;
                
                if (this.activeTextSpam.has(taskId)) {
                    this.activeTextSpam.get(taskId).active = false;
                    await delay(100);
                }
                
                const task = { active: true };
                this.activeTextSpam.set(taskId, task);
                
                const runTextSpam = async () => {
                    const batchSize = 10;
                    const batchDelay = Math.max(50, data.delay || 50);
                    while (task.active) {
                        const tasks = [];
                        for (let i = 0; i < batchSize && task.active; i++) {
                            const emoji = interfaceEmojis[Math.floor(Math.random() * interfaceEmojis.length)];
                            tasks.push(this.sock.sendMessage(from, { text: `${spamText} ${emoji}` }));
                        }

                        if (tasks.length > 0) {
                            try {
                                await Promise.allSettled(tasks);
                            } catch (err) {
                                // fallback to continue processing
                            }
                        }

                        await delay(batchDelay);
                    }
                };
                
                runTextSpam();
                
                if (sendConfirmation) {
                    await this.sendMessage(from, replyMessages.spamStarted);
                }
            }
            
            else if (commandType === 'stop_text_spam') {
                const { from } = data;
                let stopped = 0;
                
                this.activeTextSpam.forEach((task, taskId) => {
                    if (taskId.startsWith(from)) {
                        task.active = false;
                        this.activeTextSpam.delete(taskId);
                        stopped++;
                    }
                });
                
                if (stopped > 0 && sendConfirmation) {
                    await this.sendMessage(from, replyMessages.spamStopped);
                }
            }
            
            else if (commandType === 'start_swipe_spam') {
                const { from, swipeText, quotedMsgId, quotedParticipant } = data;
                const taskId = `${from}_swipespam`;
                
                if (this.activeSwipeSpam.has(taskId)) {
                    this.activeSwipeSpam.get(taskId).active = false;
                    await delay(100);
                }
                
                const task = { active: true };
                this.activeSwipeSpam.set(taskId, task);
                
                const runSwipeSpam = async () => {
                    while (task.active) {
                        try {
                            const emoji = interfaceEmojis[Math.floor(Math.random() * interfaceEmojis.length)];
                            await this.sock.sendMessage(from, { 
                                text: `${swipeText} ${emoji}` 
                            }, {
                                quoted: {
                                    key: {
                                        remoteJid: from,
                                        fromMe: false,
                                        id: quotedMsgId,
                                        participant: quotedParticipant
                                    },
                                    message: {}
                                }
                            });
                            await delay(100);
                        } catch (err) {
                            await delay(100);
                        }
                    }
                };
                
                runSwipeSpam();
                
                if (sendConfirmation) {
                    await this.sendMessage(from, replyMessages.swipeStarted);
                }
            }
            
            else if (commandType === 'stop_swipe_spam') {
                const { from } = data;
                let stopped = 0;
                
                this.activeSwipeSpam.forEach((task, taskId) => {
                    if (taskId.startsWith(from)) {
                        task.active = false;
                        this.activeSwipeSpam.delete(taskId);
                        stopped++;
                    }
                });
                
                if (stopped > 0 && sendConfirmation) {
                    await this.sendMessage(from, replyMessages.swipeStopped);
                }
            }
            
            else if (commandType === 'react_message') {
                const { from, emoji, msgKey } = data;
                
                try {
                    await this.sock.sendMessage(from, {
                        react: {
                            text: emoji,
                            key: msgKey
                        }
                    });
                } catch (err) {
                    console.error(`[${this.botId}] Reaction error:`, err.message);
                }
            }
            
            else if (commandType === 'stop_react') {
                const { from } = data;
                
                if (this.activeReactions.has(from)) {
                    this.activeReactions.delete(from);
                }
                this.activeReactions.set(from, false);
            }
            
            else if (commandType === 'set_target_slide') {
                const { from, targetNumber, replyText } = data;
                const taskId = `${from}_target_${targetNumber}`;
                
                this.targetSlides.set(taskId, {
                    targetNumber,
                    replyText,
                    active: true
                });
                
                if (sendConfirmation) {
                    await this.sendMessage(from, `${replyMessages.targetSlideSet}\n\n${convertToCustomFont('target')}: ${targetNumber}\n${convertToCustomFont('reply')}: ${replyText}`);
                }
            }
            
            else if (commandType === 'start_cs') {
                const { from, userText, csDelay, ncKey } = data;
                
                const taskId = `${from}_cs`;
                
                if (this.activeConstantAttacks.has(taskId)) {
                    this.activeConstantAttacks.get(taskId).active = false;
                    await delay(100);
                }

                const csTask = { 
                    active: true,
                    userText: userText,
                    constantIndex: 0
                };
                this.activeConstantAttacks.set(taskId, csTask);

                const runCS = async () => {
                    while (csTask.active) {
                        try {
                            const constantWord = CONSTANT_WORDS[csTask.constantIndex % CONSTANT_WORDS.length];
                            const finalText = `${userText} ${constantWord}`;
                            await this.sock.groupUpdateSubject(from, finalText);
                            csTask.constantIndex++;
                            await delay(csDelay);
                        } catch (err) {
                            await delay(csDelay);
                        }
                    }
                };

                runCS();

                if (sendConfirmation) {
                    await this.sendMessage(from, replyMessages.csStarted);
                }
            }
            
            else if (commandType === 'stop_cs') {
                const { from } = data;
                let stopped = 0;
                
                this.activeConstantAttacks.forEach((task, taskId) => {
                    if (taskId.startsWith(from)) {
                        task.active = false;
                        this.activeConstantAttacks.delete(taskId);
                        stopped++;
                    }
                });

                if (stopped > 0 && sendConfirmation) {
                    await this.sendMessage(from, replyMessages.csStopped);
                }
            }
            
            else if (commandType === 'start_nc') {
                const { from, nameText, ncKey } = data;
                const emojis = emojiArrays[ncKey] || ['❓'];
                const nameDelay = ncDelays[ncKey] || 50;
                
                for (let i = 0; i < 5; i++) {
                    const taskId = `${from}_${ncKey}_${i}`;
                    if (this.activeNameChanges.has(taskId)) {
                        this.activeNameChanges.delete(taskId);
                        await delay(100);
                    }

                    let emojiIndex = i * Math.floor(emojis.length / 5);
                    
                    const runLoop = async () => {
                        this.activeNameChanges.set(taskId, true);
                        await delay(i * 100);
                        while (this.activeNameChanges.get(taskId)) {
                            try {
                                const emoji = emojis[Math.floor(emojiIndex) % emojis.length];
                                const newName = `${nameText} ${emoji}`;
                                await this.sock.groupUpdateSubject(from, newName);
                                emojiIndex++;
                                await delay(nameDelay);
                            } catch (err) {
                                await delay(nameDelay);
                            }
                        }
                    };

                    runLoop();
                }

                if (sendConfirmation) {
                    await this.sendMessage(from, replyMessages.ncStarted);
                }
            }
            
            else if (commandType === 'start_large_nc') {
                const { from, nameText, largeKey } = data;
                const comboNames = largeNcCombos[largeKey] || ['nc1', 'nc2', 'nc3'];
                const largeDelay = ncDelays[largeKey] || 50;
                
                const largeTaskId = `${from}_${largeKey}`;
                const largeTask = { 
                    active: true, 
                    ncKeys: comboNames,
                    threads: []
                };
                this.activeLargeNc.set(largeTaskId, largeTask);
                
                console.log(`[${this.botId}] 🔥 LARGE ATTACK: Running ${comboNames.join(' + ')} simultaneously`);
                
                comboNames.forEach((ncKey, sectionIndex) => {
                    const emojis = emojiArrays[ncKey] || ['❓'];
                    const individualDelay = ncDelays[ncKey] || 50;
                    
                    for (let threadIndex = 0; threadIndex < 3; threadIndex++) {
                        const threadId = `${from}_${largeKey}_${ncKey}_${threadIndex}`;
                        
                        if (this.activeNameChanges.has(threadId)) {
                            this.activeNameChanges.delete(threadId);
                        }

                        let emojiIndex = threadIndex * Math.floor(emojis.length / 3);
                        
                        const runLargeThread = async () => {
                            this.activeNameChanges.set(threadId, true);
                            await delay((sectionIndex * 50) + (threadIndex * 30));
                            
                            while (this.activeNameChanges.get(threadId) && largeTask.active) {
                                try {
                                    const emoji = emojis[Math.floor(emojiIndex) % emojis.length];
                                    const newName = `${nameText} ${emoji}`;
                                    await this.sock.groupUpdateSubject(from, newName);
                                    emojiIndex++;
                                    await delay(individualDelay);
                                } catch (err) {
                                    await delay(individualDelay);
                                }
                            }
                            this.activeNameChanges.delete(threadId);
                        };

                        largeTask.threads.push(threadId);
                        runLargeThread();
                    }
                });

                if (sendConfirmation) {
                    const firstEmoji = emojiArrays[comboNames[0]]?.[0] || '❓';
                    const secondEmoji = emojiArrays[comboNames[1]]?.[0] || '❓';
                    const thirdEmoji = emojiArrays[comboNames[2]]?.[0] || '❓';
                    
                    const confirmationMsg = `${replyMessages.realLargeAttack}\n\n` +
                                          `${convertToCustomFont('running')}: ${comboNames.join(' + ')}\n` +
                                          `${convertToCustomFont('emojis')}: ${firstEmoji} ${secondEmoji} ${thirdEmoji}\n` +
                                          `${convertToCustomFont('delay')}: ${largeDelay}ᴍs`;
                    
                    await this.sendMessage(from, confirmationMsg);
                }
            }
            
            else if (commandType === 'stop_nc') {
                const { from } = data;
                let stopped = 0;
                
                this.activeNameChanges.forEach((value, taskId) => {
                    if (taskId.startsWith(from) && !taskId.includes('_large')) {
                        this.activeNameChanges.set(taskId, false);
                        this.activeNameChanges.delete(taskId);
                        stopped++;
                    }
                });

                if (stopped > 0 && sendConfirmation) {
                    await this.sendMessage(from, replyMessages.ncStopped);
                }
            }
            
            else if (commandType === 'stop_large_nc') {
                const { from } = data;
                let stoppedCombos = 0;
                
                this.activeLargeNc.forEach((task, taskId) => {
                    if (taskId.startsWith(from)) {
                        task.active = false;
                        
                        task.threads?.forEach(threadId => {
                            if (this.activeNameChanges.has(threadId)) {
                                this.activeNameChanges.delete(threadId);
                            }
                        });
                        
                        task.ncKeys?.forEach(ncKey => {
                            for (let i = 0; i < 3; i++) {
                                const threadId = `${from}_${taskId.split('_')[1]}_${ncKey}_${i}`;
                                if (this.activeNameChanges.has(threadId)) {
                                    this.activeNameChanges.delete(threadId);
                                }
                            }
                        });
                        
                        this.activeLargeNc.delete(taskId);
                        stoppedCombos++;
                    }
                });

                if (stoppedCombos > 0 && sendConfirmation) {
                    await this.sendMessage(from, replyMessages.ncStopped);
                }
            }
            
        } catch (err) {
            console.error(`[${this.botId}] executeCommand error:`, err.message);
        }
    }

    async sendMessage(jid, text, mentions = []) {
        if (!this.sock || !this.connected) return;
        try {
            const message = { text };
            if (mentions.length > 0) {
                message.mentions = mentions;
            }
            await this.sock.sendMessage(jid, message);
        } catch (err) {
            console.error(`[${this.botId}] Send message error:`, err.message);
        }
    }
}

class BotManager {
    constructor() {
        this.bots = new Map();
        this.commandBus = new CommandBus();
        this.botCounter = 0;
        this.loadedData = this.loadBots();
    }

    loadBots() {
        try {
            if (fs.existsSync(BOTS_FILE)) {
                const data = fs.readFileSync(BOTS_FILE, 'utf8');
                const savedBots = JSON.parse(data);
                this.botCounter = savedBots.counter || 0;
                console.log(`[MANAGER] Found ${savedBots.bots?.length || 0} saved bot(s)`);
                return savedBots;
            }
        } catch (err) {
            console.log('[MANAGER] No saved bots found, starting fresh');
        }
        return { counter: 0, bots: [] };
    }

    saveBots() {
        try {
            if (!fs.existsSync('./data')) {
                fs.mkdirSync('./data', { recursive: true });
            }
            const data = {
                counter: this.botCounter,
                bots: Array.from(this.bots.entries()).map(([id, bot]) => ({
                    id,
                    phoneNumber: bot.phoneNumber,
                    connected: bot.connected
                }))
            };
            fs.writeFileSync(BOTS_FILE, JSON.stringify(data, null, 2));
        } catch (err) {
            console.error('[MANAGER] Error saving bots:', err.message);
        }
    }

    async restoreSavedBots() {
        if (this.loadedData.bots && this.loadedData.bots.length > 0) {
            console.log(`[MANAGER] Restoring ${this.loadedData.bots.length} bot session(s)...`);
            
            for (const botData of this.loadedData.bots) {
                const authPath = `./auth/${botData.id}`;
                const hasAuth = fs.existsSync(authPath) && fs.readdirSync(authPath).length > 0;
                
                let phoneNumber = botData.phoneNumber;
                
                if (!hasAuth && !phoneNumber) {
                    console.log(`\n[MANAGER] ${botData.id} has no credentials and no phone number.`);
                    phoneNumber = await question(`Enter phone number for ${botData.id} (e.g. 919876543210): `);
                    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
                    
                    if (!phoneNumber || phoneNumber.length < 10) {
                        console.log(`[MANAGER] Invalid number. Removing ${botData.id}...`);
                        continue;
                    }
                }
                
                const session = new BotSession(botData.id, phoneNumber, this, null);
                this.bots.set(botData.id, session);
                this.commandBus.registerBot(botData.id, session);
                
                console.log(`[MANAGER] Reconnecting ${botData.id}...`);
                await session.connect();
                await delay(2000);
            }
            
            this.saveBots();
        } else {
            console.log('[MANAGER] No saved sessions. Waiting for first bot via .add command...');
            
            const phoneNumber = await question('Enter phone number for BOT1 (or press Enter to skip): ');
            if (phoneNumber && phoneNumber.trim()) {
                const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
                if (cleanNumber.length >= 10) {
                    await this.addBot(cleanNumber, null);
                }
            } else {
                console.log('[MANAGER] Skipped. Use .add command in WhatsApp to add bots.\n');
            }
        }
    }

    async addBot(phoneNumber, requestingJid = null) {
        this.botCounter++;
        const botId = `BOT${this.botCounter}`;
        
        const session = new BotSession(botId, phoneNumber, this, requestingJid);
        this.bots.set(botId, session);
        this.commandBus.registerBot(botId, session);
        
        await session.connect();
        this.saveBots();
        
        const replyMessages = getReplyMessages();
        return `${replyMessages.botCreated}\n\n✅ ${convertToCustomFont('bot session created')}\n📱 ${replyMessages.number} ${phoneNumber}\n\n⏳ ${convertToCustomFont('waiting for pairing code')}`;
    }

    removeBot(botId) {
        if (this.bots.has(botId)) {
            this.commandBus.unregisterBot(botId);
            this.bots.delete(botId);
            this.saveBots();
            console.log(`[MANAGER] Removed ${botId}`);
        }
    }
}

console.log(`\n╔═══════════════════════════════════════════╗`);
console.log(`       ${convertToCustomFont('LOFI DADDY BOT SYSTEM')} 🔥`);
console.log(`╚═══════════════════════════════════════════╝\n`);
console.log(`${convertToCustomFont('features')}:`);
console.log(`${convertToCustomFont('• constant text attack')} 🌀`);
console.log(`${convertToCustomFont('• large attacks (1-30)')} 🔥`);
console.log(`${convertToCustomFont('• 13 nc types with emojis')} ⚔️`);
console.log(`${convertToCustomFont('• pic spam')} 📸`);
console.log(`${convertToCustomFont('• text spam')} 💬`);
console.log(`${convertToCustomFont('• swipe reply spam')} 🔄`);
console.log(`${convertToCustomFont('• target slide auto-reply')} 🎯`);
console.log(`${convertToCustomFont('• fast pairing system')} ⚡\n`);
console.log(`${convertToCustomFont('send ~menu to see all commands')} 🎀\n`);

const botManager = new BotManager();
await botManager.restoreSavedBots();
rl.close();

const replyMessages = getReplyMessages();
console.log(`\n✅ ${replyMessages.connected}`);
console.log(`${convertToCustomFont('send ~admin in dm to become admin')} 💎`);
console.log(`${convertToCustomFont('send ~menu for all commands')} 🎀`);
console.log(`${convertToCustomFont('enjoy LOFI DADDY BOT')} 🔥\n`);
