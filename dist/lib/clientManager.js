import { UserClient } from "./userClient.js";
import { UserAPI } from "./userAPI.js";
export class ClientManager {
    clients = new Map();
    apis = new Map();
    prisma;
    encryption;
    constructor(prisma, encryption) {
        this.prisma = prisma;
        this.encryption = encryption;
    }
    async initialize() {
        const accounts = await this.prisma.userAccount.findMany({
            include: { farmSessions: true },
        });
        for (const account of accounts) {
            try {
                const decryptedToken = this.encryption.decryptToken(account.encryptedToken);
                const userClient = new UserClient(decryptedToken);
                await userClient.connect();
                this.clients.set(account.userId, userClient);
                this.apis.set(account.userId, new UserAPI(decryptedToken));
                console.log(`[ClientManager] Reconnected account: ${account.discordUsername}`);
                // Reconnect to active farms
                for (const farm of account.farmSessions) {
                    try {
                        await userClient.joinVoiceChannel(farm.guildId, farm.channelId);
                        console.log(`[ClientManager] Reconnected farm: ${farm.guildId}/${farm.channelId}`);
                    }
                    catch (err) {
                        console.error(`[ClientManager] Failed to reconnect farm ${farm.guildId}/${farm.channelId}:`, err);
                    }
                }
            }
            catch (err) {
                console.error(`[ClientManager] Failed to reconnect account ${account.userId}:`, err);
            }
        }
    }
    async addClient(userId, token) {
        try {
            // Validate token by connecting
            const testClient = new UserClient(token);
            await testClient.connect();
            const userInfo = testClient.getInfo();
            testClient.disconnect();
            // Encrypt and save token
            const encryptedToken = this.encryption.encryptToken(token);
            await this.prisma.userAccount.upsert({
                where: { userId },
                update: {
                    encryptedToken,
                    discordUserId: userInfo.userId,
                    discordUsername: userInfo.username,
                },
                create: {
                    userId,
                    discordUserId: userInfo.userId,
                    discordUsername: userInfo.username,
                    encryptedToken,
                },
            });
            // Create and store client
            const userClient = new UserClient(token);
            await userClient.connect();
            this.clients.set(userId, userClient);
            this.apis.set(userId, new UserAPI(token));
            console.log(`[ClientManager] Added account: ${userInfo.username}`);
        }
        catch (err) {
            console.error("[ClientManager] Failed to add client:", err);
            throw err;
        }
    }
    async removeClient(userId) {
        const client = this.clients.get(userId);
        if (client) {
            client.disconnect();
            this.clients.delete(userId);
        }
        this.apis.delete(userId);
        // Remove from database
        await this.prisma.userAccount.delete({
            where: { userId },
        });
        console.log(`[ClientManager] Removed account: ${userId}`);
    }
    async joinVoiceChannel(userId, guildId, channelId) {
        const client = this.clients.get(userId);
        if (!client || !client.isConnected()) {
            throw new Error(`Client not connected for user ${userId}`);
        }
        await client.joinVoiceChannel(guildId, channelId);
        // Save farm session
        await this.prisma.farmSession.upsert({
            where: {
                userId_guildId: { userId, guildId },
            },
            update: {
                channelId,
                startedAt: new Date(),
            },
            create: {
                userId,
                guildId,
                channelId,
            },
        });
        console.log(`[ClientManager] Joined farm: ${userId} -> ${guildId}/${channelId}`);
    }
    async leaveVoiceChannel(userId, guildId) {
        const client = this.clients.get(userId);
        if (!client || !client.isConnected()) {
            throw new Error(`Client not connected for user ${userId}`);
        }
        await client.leaveVoiceChannel(guildId);
        // Remove farm session
        await this.prisma.farmSession.deleteMany({
            where: { userId, guildId },
        });
        console.log(`[ClientManager] Left farm: ${userId} -> ${guildId}`);
    }
    async leaveAllVoiceChannels(userId) {
        const client = this.clients.get(userId);
        if (!client || !client.isConnected()) {
            throw new Error(`Client not connected for user ${userId}`);
        }
        const farms = await this.prisma.farmSession.findMany({
            where: { userId },
        });
        for (const farm of farms) {
            await client.leaveVoiceChannel(farm.guildId);
        }
        // Remove all farm sessions
        await this.prisma.farmSession.deleteMany({
            where: { userId },
        });
        console.log(`[ClientManager] Left all farms for user: ${userId}`);
    }
    async getFarmSessions(userId) {
        const farms = await this.prisma.farmSession.findMany({
            where: { userId },
        });
        return farms.map((f) => ({
            guildId: f.guildId,
            channelId: f.channelId,
            startedAt: f.startedAt,
            durationMs: Date.now() - f.startedAt.getTime(),
        }));
    }
    getClient(userId) {
        return this.clients.get(userId);
    }
    getAPI(userId) {
        return this.apis.get(userId);
    }
    async getAllAccounts() {
        const accounts = await this.prisma.userAccount.findMany();
        return accounts.map((a) => ({
            userId: a.userId,
            username: a.discordUsername,
        }));
    }
    isClientConnected(userId) {
        const client = this.clients.get(userId);
        return client ? client.isConnected() : false;
    }
    disconnectAll() {
        for (const client of this.clients.values()) {
            client.disconnect();
        }
        this.clients.clear();
        this.apis.clear();
    }
}
//# sourceMappingURL=clientManager.js.map