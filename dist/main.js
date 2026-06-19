#!/usr/bin/env node
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Encryption } from "./lib/encryption.js";
import { ClientManager } from "./lib/clientManager.js";
import { CommandManager } from "./commands/commandManager.js";
import inquirer from "inquirer";
const prisma = new PrismaClient();
async function main() {
    try {
        console.log(`
╔════════════════════════════════════════╗
║   🔮 Self by Saint - 216v              ║
║   Selfbot Discord CLI                  ║
╚════════════════════════════════════════╝
    `);
        // Initialize encryption with master password
        const encryption = new Encryption();
        const accounts = await prisma.userAccount.count();
        if (accounts === 0) {
            console.log("🔐 Primeira execução. Defina sua senha master:");
            const passwordAnswer = await inquirer.prompt([
                {
                    type: "password",
                    name: "masterPassword",
                    message: "Senha Master:",
                    mask: "*",
                },
            ]);
            encryption.setMasterPassword(passwordAnswer.masterPassword);
        }
        else {
            console.log("🔐 Digite sua senha master para acessar as contas:");
            let passwordCorrect = false;
            while (!passwordCorrect) {
                const passwordAnswer = await inquirer.prompt([
                    {
                        type: "password",
                        name: "masterPassword",
                        message: "Senha Master:",
                        mask: "*",
                    },
                ]);
                try {
                    encryption.setMasterPassword(passwordAnswer.masterPassword);
                    // Try to decrypt a token to validate password
                    const account = await prisma.userAccount.findFirst();
                    if (account) {
                        encryption.decryptToken(account.encryptedToken);
                        passwordCorrect = true;
                    }
                }
                catch {
                    console.log("\n❌ Senha incorreta. Tente novamente.");
                }
            }
        }
        console.log("\n✅ Autenticado!\n");
        // Initialize ClientManager and load existing accounts
        const clientManager = new ClientManager(prisma, encryption);
        console.log("⏳ Carregando contas registradas...");
        await clientManager.initialize();
        console.log("✅ Contas carregadas.\n");
        // Initialize CommandManager and show menu
        const commandManager = new CommandManager(clientManager, prisma);
        // Handle graceful shutdown
        process.on("SIGINT", async () => {
            console.log("\n\n👋 Desconectando...");
            clientManager.disconnectAll();
            await prisma.$disconnect();
            process.exit(0);
        });
        await commandManager.showMainMenu();
    }
    catch (err) {
        console.error("❌ Erro fatal:", err);
        process.exit(1);
    }
}
main().catch(async (err) => {
    console.error("❌ Erro:", err);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=main.js.map