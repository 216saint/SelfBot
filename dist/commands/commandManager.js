import inquirer from "inquirer";
import { RegisterAccountCommand } from "./registerAccount.js";
import { ClearDMsCommand } from "./clearDMs.js";
import { FarmCallCommand } from "./farmCall.js";
import { ClearServersCommand } from "./clearServers.js";
import { RPCCommand } from "./rpc.js";
export class CommandManager {
    clientManager;
    prisma;
    constructor(clientManager, prisma) {
        this.clientManager = clientManager;
        this.prisma = prisma;
    }
    async showMainMenu() {
        const answer = await inquirer.prompt([
            {
                type: "list",
                name: "action",
                message: "🔮 Self by Saint - 216v",
                choices: [
                    { name: "📝 Registrar Conta (via token)", value: "register" },
                    { name: "🔑 Acessar Contas Registradas", value: "access" },
                    { name: "❌ Sair", value: "exit" },
                ],
            },
        ]);
        switch (answer.action) {
            case "register":
                await this.handleRegisterAccount();
                break;
            case "access":
                await this.handleAccessAccounts();
                break;
            case "exit":
                console.log("\n👋 Até logo!");
                process.exit(0);
        }
        await this.showMainMenu();
    }
    async handleRegisterAccount() {
        const registerCmd = new RegisterAccountCommand(this.clientManager);
        await registerCmd.execute();
    }
    async handleAccessAccounts() {
        const accounts = await this.clientManager.getAllAccounts();
        if (accounts.length === 0) {
            console.log("\n⚠️  Nenhuma conta registrada ainda.");
            return;
        }
        const answer = await inquirer.prompt([
            {
                type: "list",
                name: "userId",
                message: "Selecione a conta:",
                choices: accounts.map((a) => ({
                    name: a.username,
                    value: a.userId,
                })),
            },
        ]);
        await this.showAccountMenu(answer.userId);
    }
    async showAccountMenu(userId) {
        const accounts = await this.clientManager.getAllAccounts();
        const account = accounts.find((a) => a.userId === userId);
        if (!account) {
            console.log("\n⚠️  Conta não encontrada.");
            return;
        }
        const answer = await inquirer.prompt([
            {
                type: "list",
                name: "action",
                message: `Conta: ${account.username}`,
                choices: [
                    { name: "🗑️  Clear DMs", value: "clearDMs" },
                    { name: "🎙️  FarmCall", value: "farmCall" },
                    { name: "🚪 Clear Servers", value: "clearServers" },
                    { name: "🎮 RPC/Status", value: "rpc" },
                    { name: "📊 Ver Farms Ativos", value: "viewFarms" },
                    { name: "🔙 Voltar", value: "back" },
                ],
            },
        ]);
        switch (answer.action) {
            case "clearDMs":
                await this.handleClearDMs(userId);
                break;
            case "farmCall":
                await this.handleFarmCall(userId);
                break;
            case "clearServers":
                await this.handleClearServers(userId);
                break;
            case "rpc":
                await this.handleRPC(userId);
                break;
            case "viewFarms":
                await this.handleViewFarms(userId);
                break;
            case "back":
                return;
        }
        await this.showAccountMenu(userId);
    }
    async handleClearDMs(userId) {
        const api = this.clientManager.getAPI(userId);
        if (!api) {
            console.log("\n⚠️  API não conectada.");
            return;
        }
        const clearDMsCmd = new ClearDMsCommand(api);
        await clearDMsCmd.execute();
    }
    async handleFarmCall(userId) {
        const client = this.clientManager.getClient(userId);
        const api = this.clientManager.getAPI(userId);
        if (!client || !api) {
            console.log("\n⚠️  Client ou API não conectado.");
            return;
        }
        const farmCallCmd = new FarmCallCommand(this.clientManager, api, userId);
        await farmCallCmd.execute();
    }
    async handleClearServers(userId) {
        const api = this.clientManager.getAPI(userId);
        if (!api) {
            console.log("\n⚠️  API não conectada.");
            return;
        }
        const clearServersCmd = new ClearServersCommand(api);
        await clearServersCmd.execute();
    }
    async handleRPC(userId) {
        const client = this.clientManager.getClient(userId);
        if (!client) {
            console.log("\n⚠️  Client não conectado.");
            return;
        }
        const rpcCmd = new RPCCommand(client, this.prisma, userId);
        await rpcCmd.execute();
    }
    async handleViewFarms(userId) {
        const farms = await this.clientManager.getFarmSessions(userId);
        if (farms.length === 0) {
            console.log("\n📭 Nenhum farm ativo.");
            return;
        }
        console.log("\n🎙️  Farms Ativos:");
        farms.forEach((farm, idx) => {
            const hours = Math.floor(farm.durationMs / 3600000);
            const minutes = Math.floor((farm.durationMs % 3600000) / 60000);
            console.log(`  ${idx + 1}. Servidor: ${farm.guildId} | Canal: ${farm.channelId} | Duração: ${hours}h ${minutes}m`);
        });
        console.log();
    }
}
//# sourceMappingURL=commandManager.js.map