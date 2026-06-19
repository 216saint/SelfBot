import { UserClient } from "./userClient.js";
import { UserAPI } from "./userAPI.js";
export class ClientManager {
    clients = new Map();
    apis = new Map();
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async initialize() {
        const accounts = await this.prisma.userAccount.findMany({
            include: { farmSessions: true },
        });
        for (const account of accounts) {
            try {
                const token = account.encryptedToken;
                const userClient = new UserClient(token);
                await userClient.connect();
                this.clients.set(account.userId, userClient);
                this.apis.set(account.userId, new UserAPI(token));
                for (const farm of account.farmSessions) {
                    try {
                        await userClient.joinVoiceChannel(farm.guildId, farm.channelId);
                    }
                    catch (err) {
                    }
                }
            }
            catch (err) {
            }
        }
    }
    async addClient(userId, token) {
        try {
            const testClient = new UserClient(token);
            await testClient.connect();
            const userInfo = testClient.getInfo();
            testClient.disconnect();
            await this.prisma.userAccount.upsert({
                where: { userId },
                update: {
                    encryptedToken: token,
                    discordUserId: userInfo.userId,
                    discordUsername: userInfo.username,
                },
                create: {
                    userId,
                    discordUserId: userInfo.userId,
                    discordUsername: userInfo.username,
                    encryptedToken: token,
                },
            });
            const userClient = new UserClient(token);
            await userClient.connect();
            this.clients.set(userId, userClient);
            this.apis.set(userId, new UserAPI(token));
        }
        catch (err) {
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
        await this.prisma.userAccount.delete({
            where: { userId },
        });
    }
    async joinVoiceChannel(userId, guildId, channelId) {
        const client = this.clients.get(userId);
        if (!client || !client.isConnected()) {
            throw new Error(`Client not connected for user ${userId}`);
        }
        await client.joinVoiceChannel(guildId, channelId);
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
    }
    async leaveVoiceChannel(userId, guildId) {
        const client = this.clients.get(userId);
        if (!client || !client.isConnected()) {
            throw new Error(`Client not connected for user ${userId}`);
        }
        await client.leaveVoiceChannel(guildId);
        await this.prisma.farmSession.deleteMany({
            where: { userId, guildId },
        });
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
        await this.prisma.farmSession.deleteMany({
            where: { userId },
        });
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