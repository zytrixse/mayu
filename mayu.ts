import 'dotenv/config';
import WebSocket from 'ws';

const BOT_TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;
const WELCOME_MESSAGE = (process.env.WELCOME_MESSAGE || 'Welcome to the server, {{USERNAME}}! 🎉\n Please be sure to read the rules!').replace(/^"|"$/g, '');

if (!BOT_TOKEN || !GUILD_ID || !WELCOME_CHANNEL_ID) {
    console.error('Missing required environment variables (BOT_TOKEN, GUILD_ID, WELCOME_CHANNEL_ID)');
    process.exit(1);
}

const GATEWAY_URL = 'wss://gateway.discord.gg/?v=10&encoding=json';
const INTENTS = 1 << 1;

enum Opcode {
    DISPATCH = 0,
    HEARTBEAT = 1,
    IDENTIFY = 2,
    HEARTBEAT_ACK = 10,
    RECONNECT = 7,
    HELLO = 10,
}

interface GatewayPayload {
    op: Opcode;
    d: any;
    s?: number;
    t?: string;
}

class MayuWelcomeBot {
    private ws: WebSocket | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private sequence: number | null = null;
    private sessionId: string | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    public start(): void {
        this.connect();
    }

    private connect(): void {
        this.ws = new WebSocket(GATEWAY_URL);

        this.ws.on('open', () => {
            console.log('[Mayu] Connected to Discord Gateway');
            this.reconnectAttempts = 0;
        });

        this.ws.on('message', (data: Buffer) => this.handleMessage(data));

        this.ws.on('close', (code: number, reason: Buffer) => {
            console.log(`[Mayu] WebSocket closed: ${code} - ${reason.toString()}`);
            this.cleanup();
            this.reconnect();
        });

        this.ws.on('error', (error: Error) => {
            console.error('[Mayu] WebSocket error:', error);
            this.cleanup();
            this.reconnect();
        });
    }

    private async handleMessage(data: Buffer): Promise<void> {
        const payload: GatewayPayload = JSON.parse(data.toString());

        switch (payload.op) {
            case Opcode.DISPATCH:
                this.sequence = payload.s || null;
                await this.handleDispatch(payload);
                break;
            case Opcode.HELLO:
                this.startHeartbeat(payload.d.heartbeat_interval);
                this.identify();
                break;
            case Opcode.HEARTBEAT_ACK:
                console.log('[Mayu] Heartbeat acknowledged');
                break;
            case Opcode.RECONNECT:
                console.log('[Mayu] Received reconnect request');
                this.reconnect();
                break;
        }
    }

    private async handleDispatch(payload: GatewayPayload): Promise<void> {
        if (payload.t === 'GUILD_MEMBER_ADD' && payload.d.guild_id === GUILD_ID) {
            const { username, id, avatar, discriminator } = payload.d.user;
            await this.sendWelcomeMessage(username, id, avatar, discriminator);
        }
    }

    private startHeartbeat(interval: number): void {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ op: Opcode.HEARTBEAT, d: this.sequence }));
                console.log('[Mayu] Sent heartbeat');
            }
        }, interval);
    }

    private identify(): void {
        if (!this.ws) return;

        const identifyPayload = {
            op: Opcode.IDENTIFY,
            d: {
                token: BOT_TOKEN,
                intents: INTENTS,
                properties: {
                    $os: 'linux',
                    $browser: 'custom',
                    $device: 'custom',
                },
            },
        };

        this.ws.send(JSON.stringify(identifyPayload));
        console.log('[Mayu] Sent identify payload');
    }

    private async sendWelcomeMessage(username: string, userId: string, avatar: string | null, discriminator: string): Promise<void> {
        try {
            const messageContent = WELCOME_MESSAGE.replace('{{USERNAME}}', username);

            let avatarUrl: string;
            if (avatar) {
                avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=128`;
            } else {
                const defaultAvatarIndex = discriminator === '0' ? Number(userId) % 5 : Number(discriminator) % 5;
                avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
            }

            const embed = {
                title: 'Welcome to the Server!',
                description: messageContent,
                color: 0x3498db,
                timestamp: new Date().toISOString(),
                footer: { text: 'Powered by Mayu' },
                thumbnail: { url: avatarUrl },
            };

            const response = await fetch(`https://discord.com/api/v10/channels/${WELCOME_CHANNEL_ID}/messages`, {
                method: 'POST',
                headers: {
                    Authorization: `Bot ${BOT_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    embeds: [embed],
                }),
            });

            if (!response.ok) {
                console.error(`[Mayu] Failed to send welcome embed: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('[Mayu] Error sending welcome embed:', error);
        }
    }

    private cleanup(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        this.ws = null;
    }

    private reconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnect attempts reached. Exiting.');
            process.exit(1);
        }

        const delay = Math.pow(2, this.reconnectAttempts) * 1000;
        this.reconnectAttempts++;
        console.log(`[Mayu] Reconnecting in ${delay}ms... Attempt ${this.reconnectAttempts}`);

        setTimeout(() => {
            this.connect();
        }, delay);
    }
}

const bot = new MayuWelcomeBot();
bot.start();