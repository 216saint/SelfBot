import inquirer from "inquirer";
import cliProgress from "cli-progress";
import { BackupService } from "../lib/backupService.js";
export class ClearDMsCommand {
    api;
    constructor(api) {
        this.api = api;
    }
    async execute() {
        try {
            console.log("\n⏳ Carregando DMs...");
            const dmChannels = await this.api.getDMChannels();
            if (dmChannels.length === 0) {
                console.log("\n📭 Nenhuma DM encontrada.");
                return;
            }
            const answer = await inquirer.prompt([
                {
                    type: "list",
                    name: "dmChoice",
                    message: "Selecione as DMs a limpar:",
                    choices: [
                        ...dmChannels.map((dm, idx) => ({
                            name: `DM ${idx + 1}: ${this.getDMName(dm)}`,
                            value: dm.id,
                        })),
                        { name: "🗑️  Limpar TODAS as DMs", value: "all" },
                    ],
                },
            ]);
            if (answer.dmChoice === "all") {
                await this.handleClearAllDMs(dmChannels);
            }
            else {
                const selectedDM = dmChannels.find((d) => d.id === answer.dmChoice);
                if (selectedDM) {
                    await this.handleClearSpecificDM(selectedDM);
                }
            }
        }
        catch (err) {
            console.error("\n❌ Erro ao limpar DMs:", err);
        }
    }
    getDMName(dm) {
        if (dm.recipients && dm.recipients.length > 0) {
            return dm.recipients.map((r) => r.username).join(", ");
        }
        return `Group DM ${dm.id.substring(0, 8)}`;
    }
    async handleClearAllDMs(dmChannels) {
        const confirmation = await inquirer.prompt([
            {
                type: "confirm",
                name: "confirmed",
                message: `⚠️  Tem certeza? Isso vai apagar TODAS as mensagens em ${dmChannels.length} DMs.`,
                default: false,
            },
        ]);
        if (!confirmation.confirmed) {
            console.log("\n❌ Operação cancelada.");
            return;
        }
        for (const dm of dmChannels) {
            await this.clearDMMessages(dm.id, this.getDMName(dm), null);
        }
    }
    async handleClearSpecificDM(dm) {
        const dmName = this.getDMName(dm);
        const answer = await inquirer.prompt([
            {
                type: "list",
                name: "deleteMode",
                message: "Selecione como deletar:",
                choices: [
                    { name: "📥 Recente → Antiga", value: "recent" },
                    { name: "📤 Antiga → Recente", value: "old" },
                    { name: "🗑️  Todas as mensagens", value: "all" },
                ],
            },
        ]);
        if (answer.deleteMode === "all") {
            const confirmAll = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "confirmed",
                    message: `⚠️  Tem certeza? Vai apagar TODAS as mensagens da DM "${dmName}".`,
                    default: false,
                },
            ]);
            if (!confirmAll.confirmed) {
                console.log("\n❌ Operação cancelada.");
                return;
            }
            await this.clearDMMessages(dm.id, dmName, null);
        }
        else {
            const numberAnswer = await inquirer.prompt([
                {
                    type: "number",
                    name: "count",
                    message: "Quantas mensagens deletar?",
                    default: 100,
                },
            ]);
            await this.clearDMMessages(dm.id, dmName, numberAnswer.count, answer.deleteMode === "recent");
        }
    }
    async clearDMMessages(channelId, channelName, limit, isRecent = true) {
        try {
            const backupAnswer = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "backup",
                    message: "📦 Fazer backup das mensagens antes de deletar?",
                    default: false,
                },
            ]);
            if (backupAnswer.backup) {
                console.log("💾 Fazendo backup...");
                const backupService = new BackupService(this.api);
                const backupPath = await backupService.backupDMChannel(channelId, channelName);
                console.log(`✅ Backup salvo em: ${backupPath}`);
            }
            const confirmDelete = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "confirmed",
                    message: `⚠️  Confirmar exclusão de mensagens em "${channelName}"?`,
                    default: false,
                },
            ]);
            if (!confirmDelete.confirmed) {
                console.log("\n❌ Operação cancelada.");
                return;
            }
            console.log("\n⏳ Carregando mensagens...");
            const messages = await this.api.getDMMessages(channelId, limit || 10000);
            if (messages.length === 0) {
                console.log("\n📭 Nenhuma mensagem para deletar.");
                return;
            }
            // Sort based on direction
            const sortedMessages = isRecent
                ? messages.reverse()
                : messages;
            const progressBar = new cliProgress.SingleBar({
                format: "🗑️  Deletando | {bar} | {value}/{total} | {percentage}%",
                barCompleteChar: "█",
                barIncompleteChar: "░",
                hideCursor: true,
            });
            progressBar.start(sortedMessages.length, 0);
            let deletedCount = 0;
            for (let i = 0; i < sortedMessages.length; i++) {
                try {
                    await this.api.deleteMessage(channelId, sortedMessages[i].id);
                    deletedCount++;
                }
                catch {
                    // Silenciosamente falha (limitação Discord para DMs)
                }
                progressBar.update(i + 1);
                // 800ms timeout para evitar rate-limit
                await new Promise((resolve) => setTimeout(resolve, 800));
            }
            progressBar.stop();
            console.log(`\n✅ Limpeza concluída! ${deletedCount}/${sortedMessages.length} mensagens deletadas.\n`);
        }
        catch (err) {
            console.error("\n❌ Erro ao limpar DMs:", err);
        }
    }
}
//# sourceMappingURL=clearDMs.js.map