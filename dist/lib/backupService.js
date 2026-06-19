import fs from "fs";
import path from "path";
import { UserAPI } from "./userAPI.js";
export class BackupService {
    api;
    backupDir;
    constructor(token) {
        this.api = new UserAPI(token);
        this.backupDir = path.join(process.cwd(), "backups", "dms");
    }
    ensureBackupDir() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }
    async backupDMChannel(channelId, channelName) {
        this.ensureBackupDir();
        const messages = await this.api.getDMMessages(channelId, 10000);
        const backupData = {
            metadata: {
                channelId,
                channelName,
                backupDate: new Date().toISOString(),
                messageCount: messages.length,
            },
            messages: messages.map((msg) => ({
                id: msg.id,
                author: {
                    id: msg.author.id,
                    username: msg.author.username,
                    avatar: msg.author.avatar,
                },
                content: msg.content,
                timestamp: msg.timestamp,
                editedTimestamp: msg.edited_timestamp,
                attachments: msg.attachments,
            })),
        };
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const fileName = `${channelId}_${timestamp}.json`;
        const filePath = path.join(this.backupDir, fileName);
        fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
        return filePath;
    }
    getBackupDir() {
        return this.backupDir;
    }
    listBackups() {
        this.ensureBackupDir();
        if (!fs.existsSync(this.backupDir)) {
            return [];
        }
        return fs
            .readdirSync(this.backupDir)
            .filter((f) => f.endsWith(".json"))
            .map((fileName) => {
            const filePath = path.join(this.backupDir, fileName);
            try {
                const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
                return {
                    fileName,
                    path: filePath,
                    messageCount: content.metadata.messageCount,
                };
            }
            catch {
                return {
                    fileName,
                    path: filePath,
                    messageCount: 0,
                };
            }
        });
    }
}
