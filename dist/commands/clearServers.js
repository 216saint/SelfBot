import inquirer from "inquirer";
import cliProgress from "cli-progress";
export class ClearServersCommand {
    api;
    constructor(api) {
        this.api = api;
    }
    async execute() {
        try {
            console.log("\n⏳ Carregando servidores...");
            const guilds = await this.api.getUserGuilds();
            if (guilds.length === 0) {
                console.log("\n⚠️  Nenhum servidor encontrado.");
                return;
            }
            const answer = await inquirer.prompt([
                {
                    type: "checkbox",
                    name: "serverChoice",
                    message: "Selecione os servidores a deixar:",
                    choices: [
                        { name: "🚪 Sair de TODOS", value: "all" },
                        new inquirer.Separator(),
                        ...guilds.map((g) => ({
                            name: g.name,
                            value: g.id,
                        })),
                    ],
                },
            ]);
            if (answer.serverChoice.length === 0) {
                console.log("\n❌ Nenhum servidor selecionado.");
                return;
            }
            let serversToLeave;
            if (answer.serverChoice.includes("all")) {
                serversToLeave = guilds.map((g) => g.id);
            }
            else {
                serversToLeave = answer.serverChoice;
            }
            const confirmation = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "confirmed",
                    message: `⚠️  Tem certeza? Você vai sair de ${serversToLeave.length} servidor(s).`,
                    default: false,
                },
            ]);
            if (!confirmation.confirmed) {
                console.log("\n❌ Operação cancelada.");
                return;
            }
            await this.leaveServers(serversToLeave);
        }
        catch (err) {
            console.error("\n❌ Erro ao limpar servidores:", err);
        }
    }
    async leaveServers(guildIds) {
        const progressBar = new cliProgress.SingleBar({
            format: "🚪 Saindo | {bar} | {value}/{total} | {percentage}%",
            barCompleteChar: "█",
            barIncompleteChar: "░",
            hideCursor: true,
        });
        progressBar.start(guildIds.length, 0);
        for (let i = 0; i < guildIds.length; i++) {
            try {
                await this.api.leaveGuild(guildIds[i]);
            }
            catch (err) {
                console.error(`\nErro ao sair do servidor ${guildIds[i]}:`, err);
            }
            progressBar.update(i + 1);
            // 800ms timeout para evitar rate-limit
            await new Promise((resolve) => setTimeout(resolve, 800));
        }
        progressBar.stop();
        console.log(`\n✅ Limpeza concluída! Saiu de ${guildIds.length} servidor(s).\n`);
    }
}
//# sourceMappingURL=clearServers.js.map