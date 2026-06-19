import inquirer from "inquirer";
import cliProgress from "cli-progress";

export class ClearFriendsCommand {
    api;
    constructor(api) {
        this.api = api;
    }
    async execute() {
        try {
            console.log("\n⏳ Carregando amigos...");
            const friends = await this.api.getFriends();
            if (friends.length === 0) {
                console.log("\n👥 Nenhum amigo encontrado.");
                return;
            }
            const answer = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "confirm",
                    message: `Tem certeza que deseja remover todos os ${friends.length} amigos?`,
                    default: false,
                },
            ]);
            if (!answer.confirm) {
                console.log("\n❌ Operação cancelada.");
                return;
            }
            await this.removeAllFriends(friends);
        }
        catch (err) {
            console.error("\n❌ Erro ao limpar amigos:", err);
        }
    }
    async removeAllFriends(friends) {
        const progressBar = new cliProgress.SingleBar({
            format: "👥 Removendo | {bar} | {value}/{total} | {percentage}%",
            barCompleteChar: "█",
            barIncompleteChar: "░",
            hideCursor: true,
        });
        progressBar.start(friends.length, 0);
        let removedCount = 0;
        for (const friend of friends) {
            try {
                await this.api.removeFriend(friend.id);
                removedCount++;
            }
            catch (err) {
            }
            progressBar.increment();
        }
        progressBar.stop();
        console.log(`\n✅ Limpeza concluída! ${removedCount}/${friends.length} amigos removidos.\n`);
    }
}
