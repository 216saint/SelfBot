#!/usr/bin/env node
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { ClientManager } from "./lib/clientManager.js";
import { CommandManager } from "./commands/commandManager.js";
const prisma = new PrismaClient();
async function main() {
    try {
        console.log(`
───▄▄─▄████▄▐▄▄▄▌
──▐──████▀███▄█▄▌
▐─▌──█▀▌──▐▀▌▀█▀
─▀───▌─▌──▐─▌
─────█─█──▐▌█

   🔮 Self by Saint - 216v
   Selfbot Discord CLI
    `);
        const clientManager = new ClientManager(prisma);
        console.log("⏳ Carregando contas registradas...");
        await clientManager.initialize();
        console.log("✅ Contas carregadas.\n");
        const commandManager = new CommandManager(clientManager, prisma);
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