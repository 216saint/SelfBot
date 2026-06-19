import inquirer from "inquirer";
export class RegisterAccountCommand {
    clientManager;
    constructor(clientManager) {
        this.clientManager = clientManager;
    }
    async execute() {
        const answers = await inquirer.prompt([
            {
                type: "password",
                name: "token",
                message: "Cole seu token Discord:",
                mask: "*",
            },
        ]);
        const token = answers.token.trim();
        if (!token) {
            console.log("\n⚠️  Token vazio. Operação cancelada.");
            return;
        }
        const confirmation = await inquirer.prompt([
            {
                type: "confirm",
                name: "confirmed",
                message: "Registrar esta conta?",
                default: true,
            },
        ]);
        if (!confirmation.confirmed) {
            console.log("\n❌ Operação cancelada.");
            return;
        }
        try {
            console.log("\n⏳ Validando token...");
            const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await this.clientManager.addClient(userId, token);
            console.log("✅ Conta registrada com sucesso!\n");
        }
        catch (err) {
            console.error("\n❌ Erro ao registrar conta:", err);
        }
    }
}
