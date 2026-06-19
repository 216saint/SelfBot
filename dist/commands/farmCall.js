import inquirer from "inquirer";
export class FarmCallCommand {
    clientManager;
    api;
    userId;
    constructor(clientManager, api, userId) {
        this.clientManager = clientManager;
        this.api = api;
        this.userId = userId;
    }
    async execute() {
        const answer = await inquirer.prompt([
            {
                type: "list",
                name: "farmAction",
                message: "FarmCall - Selecione a ação:",
                choices: [
                    { name: "▶️  Iniciar Farm", value: "start" },
                    { name: "⏹️  Parar Farm", value: "stop" },
                ],
            },
        ]);
        if (answer.farmAction === "start") {
            await this.handleStartFarm();
        }
        else {
            await this.handleStopFarm();
        }
    }
    async handleStartFarm() {
        try {
            console.log("\n⏳ Carregando servidores...");
            const guilds = await this.api.getUserGuilds();
            if (guilds.length === 0) {
                console.log("\n⚠️  Nenhum servidor encontrado.");
                return;
            }
            const guildAnswer = await inquirer.prompt([
                {
                    type: "list",
                    name: "guildId",
                    message: "Selecione o servidor:",
                    choices: guilds.map((g) => ({
                        name: g.name,
                        value: g.id,
                    })),
                },
            ]);
            const guildId = guildAnswer.guildId;
            console.log("\n⏳ Carregando canais de voz...");
            const voiceChannels = await this.api.getGuildVoiceChannels(guildId);
            if (voiceChannels.length === 0) {
                console.log("\n⚠️  Nenhum canal de voz encontrado neste servidor.");
                return;
            }
            const channelAnswer = await inquirer.prompt([
                {
                    type: "list",
                    name: "channelId",
                    message: "Selecione o canal de voz:",
                    choices: voiceChannels.map((c) => ({
                        name: c.name,
                        value: c.id,
                    })),
                },
            ]);
            const channelId = channelAnswer.channelId;
            console.log(`\n⏳ Entrando no canal de voz...`);
            await this.clientManager.joinVoiceChannel(this.userId, guildId, channelId);
            console.log(`✅ Farm iniciado! Contagem de horas começou.\n`);
        }
        catch (err) {
            console.error("\n❌ Erro ao iniciar farm:", err);
        }
    }
    async handleStopFarm() {
        try {
            const farms = await this.clientManager.getFarmSessions(this.userId);
            if (farms.length === 0) {
                console.log("\n📭 Nenhum farm ativo.");
                return;
            }
            const stopAnswer = await inquirer.prompt([
                {
                    type: "list",
                    name: "stopChoice",
                    message: "Selecione o farm a parar:",
                    choices: [
                        ...farms.map((farm, idx) => ({
                            name: `Farm ${idx + 1}: ${farm.guildId}/${farm.channelId}`,
                            value: farm.guildId,
                        })),
                        { name: "🛑 Parar TODOS os farms", value: "all" },
                    ],
                },
            ]);
            if (stopAnswer.stopChoice === "all") {
                await this.clientManager.leaveAllVoiceChannels(this.userId);
                console.log("\n✅ Todos os farms foram parados.\n");
            }
            else {
                await this.clientManager.leaveVoiceChannel(this.userId, stopAnswer.stopChoice);
                console.log("\n✅ Farm parado.\n");
            }
        }
        catch (err) {
            console.error("\n❌ Erro ao parar farm:", err);
        }
    }
}
//# sourceMappingURL=farmCall.js.map