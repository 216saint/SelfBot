import WebSocket from "ws";
import axios from "axios";
export class UserClient {
    token;
    ws = null;
    heartbeatInterval = null;
    lastHeartbeatAck = true;
    seq = null;
    userId = null;
    username = null;
    isReady = false;
    eventHandlers = new Map();
    constructor(token) {
        this.token = token;
    }
    async connect() {
        const gatewayUrl = await this.getGatewayUrl();
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(`${gatewayUrl}?v=10&encoding=json`);
            this.ws.on("open", () => {
                console.log("[UserClient] WebSocket connected");
            });
            this.ws.on("message", (data) => {
                try {
                    this.handleMessage(data);
                    if (this.isReady) {
                        resolve();
                    }
                }
                catch (err) {
                    reject(err);
                }
            });
            this.ws.on("error", (err) => {
                console.error("[UserClient] WebSocket error:", err);
                reject(err);
            });
            this.ws.on("close", () => {
                console.log("[UserClient] WebSocket closed");
                this.isReady = false;
                if (this.heartbeatInterval) {
                    clearInterval(this.heartbeatInterval);
                }
            });
            setTimeout(() => {
                if (!this.isReady) {
                    reject(new Error("Connection timeout"));
                }
            }, 15000);
        });
    }
    async getGatewayUrl() {
        try {
            const response = await axios.get("https://discord.com/api/v10/gateway");
            if (!response.data.url) {
                throw new Error("Gateway URL not found in response");
            }
            return response.data.url;
        }
        catch (err) {
            console.error("[UserClient] Failed to fetch gateway URL:", err);
            throw err;
        }
    }
    handleMessage(data) {
        const message = JSON.parse(data);
        const op = message.op;
        const d = message.d;
        const t = message.t;
        this.seq = message.s || this.seq;
        switch (op) {
            case 10: // HELLO
                this.handleHello(d);
                break;
            case 11: // HEARTBEAT_ACK
                this.lastHeartbeatAck = true;
                break;
            case 0: // DISPATCH
                this.handleDispatch(t, d);
                break;
        }
    }
    handleHello(data) {
        const heartbeatInterval = data.heartbeat_interval;
        this.sendIdentify();
        this.startHeartbeat(heartbeatInterval);
    }
    sendIdentify() {
        const identifyPayload = {
            op: 2,
            d: {
                token: this.token,
                intents: 33280, // Minimal intents
                properties: {
                    os: "linux",
                    browser: "Discord Client",
                    device: "Discord Client",
                },
            },
        };
        this.send(identifyPayload);
    }
    startHeartbeat(interval) {
        this.heartbeatInterval = setInterval(() => {
            if (!this.lastHeartbeatAck) {
                console.warn("[UserClient] Heartbeat not acknowledged, reconnecting");
                this.disconnect();
                return;
            }
            this.lastHeartbeatAck = false;
            const heartbeatPayload = {
                op: 1,
                d: this.seq,
            };
            this.send(heartbeatPayload);
        }, interval);
    }
    handleDispatch(type, data) {
        switch (type) {
            case "READY":
                this.handleReady(data);
                break;
            case "VOICE_STATE_UPDATE":
                this.emit("voiceStateUpdate", data);
                break;
            case "PRESENCE_UPDATE":
                this.emit("presenceUpdate", data);
                break;
        }
    }
    handleReady(data) {
        this.userId = data.user.id;
        this.username = data.user.username;
        this.isReady = true;
        this.emit("ready", data);
    }
    async joinVoiceChannel(guildId, channelId) {
        const voiceStatePayload = {
            op: 4,
            d: {
                guild_id: guildId,
                channel_id: channelId,
                self_mute: false,
                self_deaf: false,
            },
        };
        this.send(voiceStatePayload);
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    async leaveVoiceChannel(guildId) {
        const voiceStatePayload = {
            op: 4,
            d: {
                guild_id: guildId,
                channel_id: null,
                self_mute: false,
                self_deaf: false,
            },
        };
        this.send(voiceStatePayload);
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    setPresence(details) {
        const presencePayload = {
            op: 3,
            d: {
                since: Date.now(),
                activities: details.activities || [],
                status: details.status || "online",
                afk: false,
            },
        };
        this.send(presencePayload);
    }
    send(payload) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error("WebSocket not connected");
        }
        this.ws.send(JSON.stringify(payload));
    }
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }
    emit(event, data) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach((handler) => handler(data));
        }
    }
    disconnect() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isReady = false;
    }
    getInfo() {
        if (!this.userId || !this.username) {
            throw new Error("User not authenticated");
        }
        return { userId: this.userId, username: this.username };
    }
    isConnected() {
        return this.isReady && this.ws?.readyState === WebSocket.OPEN;
    }
}
//# sourceMappingURL=userClient.js.map