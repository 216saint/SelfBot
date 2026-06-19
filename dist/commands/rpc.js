import inquirer from "inquirer";
import { RPCManager } from "../lib/rpcManager.js";
export class RPCCommand {
    userClient;
    rpcManager;
    prisma;
    userId;
    constructor(userClient, prisma, userId) {
        this.userClient = userClient;
        this.rpcManager = new RPCManager();
        this.prisma = prisma;
        this.userId = userId;
    }
    async execute() {
        const answer = await inquirer.prompt([
            {
                type: "list",
                name: "rpcType",
                message: "Selecione o tipo de RPC:",
                choices: [
                    { name: "🎵 Spotify RPC", value: "spotify" },
                    { name: "🎮 Game RPC", value: "game" },
                    { name: "🎙️  Twitch RPC", value: "twitch" },
                    { name: "💬 Custom Status", value: "custom" },
                    { name: "👁️  Ver RPC Atual", value: "view" },
                    { name: "🗑️  Remover RPC", value: "remove" },
                ],
            },
        ]);
        switch (answer.rpcType) {
            case "spotify":
                await this.handleSpotifyRPC();
                break;
            case "game":
                await this.handleGameRPC();
                break;
            case "twitch":
                await this.handleTwitchRPC();
                break;
            case "custom":
                await this.handleCustomStatus();
                break;
            case "view":
                await this.handleViewRPC();
                break;
            case "remove":
                await this.handleRemoveRPC();
                break;
        }
    }
    async handleSpotifyRPC() {
        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "track",
                message: "Nome da música:",
            },
            {
                type: "input",
                name: "artist",
                message: "Nome do artista:",
            },
        ]);
        this.rpcManager.setSpotifyRPC(this.userClient, answers.track, answers.artist);
        const rpcDetails = this.rpcManager.buildRPCDetails("spotify", `${answers.track} - ${answers.artist}`);
        await this.persistRPC(rpcDetails);
        console.log("✅ Spotify RPC ativado!\n");
    }
    async handleGameRPC() {
        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "gameName",
                message: "Nome do jogo:",
            },
            {
                type: "input",
                name: "duration",
                message: "Duração (ex: '5 horas', 'a mil anos', deixar vazio para indefinido):",
                default: "",
            },
        ]);
        this.rpcManager.setGameRPC(this.userClient, answers.gameName, answers.duration || undefined);
        const rpcDetails = this.rpcManager.buildRPCDetails("game", answers.gameName, undefined, undefined, answers.duration || undefined);
        await this.persistRPC(rpcDetails);
        console.log("✅ Game RPC ativado!\n");
    }
    async handleTwitchRPC() {
        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "twitchLink",
                message: "Link da Twitch (https://twitch.tv/...):",
            },
            {
                type: "input",
                name: "channelName",
                message: "Nome do canal:",
            },
        ]);
        this.rpcManager.setTwitchRPC(this.userClient, answers.twitchLink, answers.channelName);
        const rpcDetails = this.rpcManager.buildRPCDetails("twitch", answers.channelName, answers.twitchLink);
        await this.persistRPC(rpcDetails);
        console.log("✅ Twitch RPC ativado!\n");
    }
    async handleCustomStatus() {
        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "text",
                message: "Texto do status:",
            },
            {
                type: "input",
                name: "emoji",
                message: "Emoji (opcional):",
                default: "",
            },
            {
                type: "input",
                name: "duration",
                message: "Duração (ex: '2 horas', deixar vazio para indefinido):",
                default: "",
            },
        ]);
        this.rpcManager.setCustomStatus(this.userClient, answers.text, answers.emoji || undefined, answers.duration || undefined);
        const rpcDetails = this.rpcManager.buildRPCDetails("custom", answers.text, undefined, answers.emoji || undefined, answers.duration || undefined);
        await this.persistRPC(rpcDetails);
        console.log("✅ Custom Status ativado!\n");
    }
    async handleViewRPC() {
        try {
            const rpc = await this.prisma.rPCStatus.findUnique({
                where: { userId: this.userId },
            });
            if (!rpc) {
                console.log("\n📭 Nenhum RPC ativo no momento.\n");
                return;
            }
            const details = JSON.parse(rpc.details);
            console.log(`\n🎭 RPC Atual:`);
            console.log(`  Tipo: ${rpc.type}`);
            console.log(`  Detalhes: ${JSON.stringify(details, null, 2)}\n`);
        }
        catch (err) {
            console.error("\n❌ Erro ao buscar RPC:", err);
        }
    }
    async handleRemoveRPC() {
        this.rpcManager.clearPresence(this.userClient);
        try {
            await this.prisma.rPCStatus.deleteMany({
                where: { userId: this.userId },
            });
            console.log("✅ RPC removido!\n");
        }
        catch (err) {
            console.error("\n❌ Erro ao remover RPC:", err);
        }
    }
    async persistRPC(rpcDetails) {
        try {
            await this.prisma.rPCStatus.upsert({
                where: { userId: this.userId },
                update: {
                    type: rpcDetails.type,
                    details: JSON.stringify(rpcDetails),
                },
                create: {
                    userId: this.userId,
                    type: rpcDetails.type,
                    details: JSON.stringify(rpcDetails),
                },
            });
        }
        catch (err) {
            console.error("\n❌ Erro ao salvar RPC:", err);
        }
    }
}
//# sourceMappingURL=rpc.js.map