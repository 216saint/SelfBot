import crypto from "crypto";
export class Encryption {
    masterKey = null;
    constructor() {
        // Sem necessidade de chave externa
    }
    setMasterPassword(password) {
        this.masterKey = crypto
            .pbkdf2Sync(password, "selfsaint", 100000, 32, "sha256")
            .slice(0, 32);
    }
    encryptToken(token) {
        if (!this.masterKey) {
            throw new Error("Master password not set");
        }
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv("aes-256-gcm", this.masterKey, iv);
        let encrypted = cipher.update(token, "utf8", "hex");
        encrypted += cipher.final("hex");
        const authTag = cipher.getAuthTag();
        return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
    }
    decryptToken(encryptedData) {
        if (!this.masterKey) {
            throw new Error("Master password not set");
        }
        const [ivHex, authTagHex, encrypted] = encryptedData.split(":");
        const iv = Buffer.from(ivHex, "hex");
        const authTag = Buffer.from(authTagHex, "hex");
        const decipher = crypto.createDecipheriv("aes-256-gcm", this.masterKey, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    }
}
//# sourceMappingURL=encryption.js.map