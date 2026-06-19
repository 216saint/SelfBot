import axios from "axios";
export class UserAPI {
    client;
    constructor(token) {
        this.client = axios.create({
            baseURL: "https://discord.com/api/v10",
            headers: {
                Authorization: token,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        });
    }
    async getUserGuilds() {
        try {
            const response = await this.client.get("/users/@me/guilds");
            return response.data;
        }
        catch (err) {
            console.error("Error fetching user guilds:", err);
            throw err;
        }
    }
    async getGuildVoiceChannels(guildId) {
        try {
            const response = await this.client.get(`/guilds/${guildId}/channels`);
            return response.data.filter((c) => c.type === 2); // 2 = GUILD_VOICE
        }
        catch (err) {
            console.error(`Error fetching voice channels for guild ${guildId}:`, err);
            throw err;
        }
    }
    async getDMChannels() {
        try {
            const response = await this.client.get("/users/@me/channels");
            return response.data.filter((c) => c.type === 1 || c.type === 3); // 1 = DM, 3 = GROUP_DM
        }
        catch (err) {
            console.error("Error fetching DM channels:", err);
            throw err;
        }
    }
    async getDMMessages(channelId, limit = 100, offset = 0) {
        try {
            const allMessages = [];
            let before = undefined;
            // Calculate how many batches we need
            const batchesNeeded = Math.ceil((limit + offset) / 100);
            for (let i = 0; i < batchesNeeded; i++) {
                const params = { limit: 100 };
                if (before) {
                    params.before = before;
                }
                const response = await this.client.get(`/channels/${channelId}/messages`, { params });
                if (response.data.length === 0)
                    break;
                allMessages.push(...response.data);
                before = response.data[response.data.length - 1].id;
                if (allMessages.length >= limit + offset) {
                    break;
                }
            }
            // Apply offset
            return allMessages.slice(offset, offset + limit);
        }
        catch (err) {
            console.error(`Error fetching messages for channel ${channelId}:`, err);
            throw err;
        }
    }
    async deleteMessage(channelId, messageId) {
        try {
            await this.client.delete(`/channels/${channelId}/messages/${messageId}`);
        }
        catch (err) {
            console.error(`Error deleting message ${messageId} from channel ${channelId}:`, err);
            throw err;
        }
    }
    async getMe() {
        try {
            const response = await this.client.get("/users/@me");
            return response.data;
        }
        catch (err) {
            console.error("Error fetching user info:", err);
            throw err;
        }
    }
    async leaveGuild(guildId) {
        try {
            await this.client.delete(`/users/@me/guilds/${guildId}`);
        }
        catch (err) {
            console.error(`Error leaving guild ${guildId}:`, err);
            throw err;
        }
    }
    async getDMChannelName(channelId) {
        try {
            const response = await this.client.get(`/channels/${channelId}`);
            const channel = response.data;
            if (channel.recipients && channel.recipients.length > 0) {
                return channel.recipients.map((r) => r.username).join(", ");
            }
            return `Group DM ${channelId}`;
        }
        catch (err) {
            console.error(`Error fetching DM channel name ${channelId}:`, err);
            throw err;
        }
    }
}
//# sourceMappingURL=userAPI.js.map