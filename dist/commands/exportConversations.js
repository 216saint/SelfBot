import inquirer from "inquirer";
import cliProgress from "cli-progress";
import { BackupService } from "../lib/backupService.js";

export class ExportConversationsCommand {
    api;
    constructor(api) {
        this.api = api;
    }
    async execute() {
        try {
            console.log("\n⏳ Carregando conversas...");
            const dmChannels = await this.api.getDMChannels();
            if (dmChannels.length === 0) {
                console.log("\n📭 Nenhuma conversa encontrada.");
                return;
            }
            const answer = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "confirm",
                    message: `Exportar ${dmChannels.length} conversa(s)?`,
                    default: true,
                },
            ]);
            if (!answer.confirm) {
                console.log("\n❌ Operação cancelada.");
                return;
            }
            await this.exportAllConversations(dmChannels);
        }
        catch (err) {
            console.error("\n❌ Erro ao exportar conversas:", err);
        }
    }
    async exportAllConversations(dmChannels) {
        const progressBar = new cliProgress.SingleBar({
            format: "📤 Exportando | {bar} | {value}/{total} | {percentage}%",
            barCompleteChar: "█",
            barIncompleteChar: "░",
            hideCursor: true,
        });
        progressBar.start(dmChannels.length, 0);
        const backupService = new BackupService();
        let exportedCount = 0;
        for (const channel of dmChannels) {
            try {
                await backupService.backupDMChannel(this.api, channel);
                exportedCount++;
            }
            catch (err) {
            }
            progressBar.increment();
        }
        progressBar.stop();
        console.log(`\n✅ Exportação concluída! ${exportedCount}/${dmChannels.length} conversas exportadas.\n`);
    }
}
