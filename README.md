# Self by Saint - 216v

**Selfbot Discord CLI** - Controle sua conta Discord via terminal com interface interativa.

Um executável que conecta à sua conta Discord usando WebSockets puros e permite automação de tarefas como limpeza de DMs, farm de voice channels, saída de servidores e gerenciamento de status.

## 🚀 Recursos

- ✅ **Autenticação Segura** - Criptografia AES-256-GCM com senha master
- ✅ **Clear DMs** - Limpeza inteligente de mensagens diretas com backup opcional
- ✅ **FarmCall** - Entrar em voice channels e fazer farm (múltiplos farms simultâneos)
- ✅ **Clear Servers** - Sair de servidores de forma organizada
- ✅ **RPC/Status** - Gerenciar presença (Spotify, Game, Twitch, Custom Status)
- ✅ **Persistência** - Farms e RPC persistem entre restarts
- ✅ **Interface CLI** - Menu interativo intuitivo no terminal

## 📋 Requisitos

- Node.js 18+ (versão com suporte a ES modules)
- npm 9+

## 🔧 Instalação

```bash
# 1. Clone o repositório
git clone <seu-repo>
cd self-saint-216v

# 2. Instale as dependências
npm install

# 3. Gere a chave de criptografia (execute no terminal)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 4. Configure o arquivo .env (já criado com valores padrão)
# Edite .env e adicione a chave de criptografia se necessário
```

## 🎮 Como Usar

### Iniciar o CLI

```bash
# Modo desenvolvimento (com reload)
npm run dev

# Modo produção (compilado)
npm run build
npm start
```

### Primeiro Login

Na primeira execução, você será solicitado a:
1. Definir uma **Senha Master** (para descriptografar suas contas)
2. Registrar uma conta com seu **Token Discord**

### Menu Principal

```
🔮 Self by Saint - 216v
├─ 📝 Registrar Conta (via token)
├─ 🔑 Acessar Contas Registradas
└─ ❌ Sair
```

### Submenu de Conta

```
Conta: seuusername
├─ 🗑️  Clear DMs
├─ 🎙️  FarmCall
├─ 🚪 Clear Servers
├─ 🎮 RPC/Status
├─ 📊 Ver Farms Ativos
└─ 🔙 Voltar
```

## 📚 Funcionalidades Detalhadas

### Clear DMs

Limpe suas mensagens diretas de forma segura:

1. Selecione as DMs (específicas ou todas)
2. Escolha a direção de deleção:
   - **Recente → Antiga**: deleta as mais novas primeiro
   - **Antiga → Recente**: deleta as mais antigas primeiro
   - **Todas as mensagens**: deleta sem filtro
3. Opcionalmente faça **backup em JSON** (com metadados)
4. Confirme e acompanhe a barra de progresso
5. **2000ms timeout** entre exclusões (evita rate-limit Discord)

### FarmCall

Controle suas conexões em voice channels:

1. Selecione um servidor (com autocomplete)
2. Escolha um canal de voz
3. **Conecte à chamada** - começa a contar horas
4. Pode iniciar múltiplos farms simultaneamente
5. Veja duração de cada farm no menu "Ver Farms Ativos"
6. Pare farms específicos ou todos de uma vez

### Clear Servers

Saia de servidores de forma organizada:

1. Selecione quais servidores deixar
2. Opção "Sair de TODOS" para sair rapidamente
3. Confirmação única (lista todos)
4. Barra de progresso com **2000ms timeout** entre saídas

### RPC/Status

Gerencie sua presença no Discord:

- **🎵 Spotify RPC**: Exibir música atual
- **🎮 Game RPC**: Mostrar jogo com duração customizável
- **🎙️ Twitch RPC**: Link + nome do canal
- **💬 Custom Status**: Texto + emoji + duração
- **👁️ Ver RPC Atual**: Veja o status ativo
- **🗑️ Remover RPC**: Limpe o status

**Importante**: RPCs persistem entre restarts!

## 🔐 Segurança

- **Criptografia**: AES-256-GCM (padrão militar)
- **Senha Master**: Derivada com PBKDF2 (100.000 iterações)
- **IV Aleatório**: Cada token tem seu próprio IV
- **Auth Tag**: Validação de integridade (GCM)
- **Tokens**: Nunca armazenados em plaintext

## 📁 Estrutura

```
self-saint-216v/
├── src/
│   ├── lib/                    # Camada lógica
│   │   ├── userClient.ts       # WebSocket Discord
│   │   ├── clientManager.ts    # Orquestração
│   │   ├── encryption.ts       # Criptografia
│   │   ├── userAPI.ts          # Requisições REST
│   │   ├── backupService.ts    # Backup de DMs
│   │   └── rpcManager.ts       # Gerenciamento de RPC
│   ├── commands/               # Comandos CLI
│   │   ├── commandManager.ts
│   │   ├── registerAccount.ts
│   │   ├── clearDMs.ts
│   │   ├── farmCall.ts
│   │   ├── clearServers.ts
│   │   └── rpc.ts
│   └── main.ts                 # Ponto de entrada
├── prisma/
│   └── schema.prisma           # Schema do banco
├── backups/dms/                # Backups (gerado)
├── database.sqlite             # Banco local (gerado)
└── dist/                       # Compilado (gerado)
```

## 🗄️ Banco de Dados

**Modelos Prisma**:
- `UserAccount` - Contas registradas com tokens criptografados
- `FarmSession` - Farms ativos (guildId, channelId, duração)
- `RPCStatus` - Status persistido (tipo, detalhes, duração)
- `DMBackup` - Histórico de backups feitos

## ⚙️ Variáveis de Ambiente

```bash
# .env
DATABASE_URL="file:./database.sqlite"
ENCRYPTION_KEY="<sua-chave-base64>"
DISCORD_API_BASE="https://discordapp.com/api/v10"
DISCORD_GATEWAY_VERSION="10"
```

## 🛠️ Scripts npm

```bash
npm run dev              # Rodar com reload (desenvolvimento)
npm run build            # Compilar TypeScript
npm start                # Rodar compilado (produção)
npm run prisma:generate  # Regenerar Prisma Client
npm run prisma:migrate   # Criar nova migração
npm run prisma:studio    # Abrir Prisma Studio (GUI)
```

## ⚠️ Avisos Importantes

- **Usar selfbots violar TOS do Discord** - Use por sua conta e risco
- **Cuidado com DMs** - Backup antes de deletar mensagens importantes
- **Rate-limiting** - O bot respeita timeouts (2000ms) para evitar banimento
- **Tokens privados** - Nunca compartilhe seu token ou .env com ninguém

## 🔄 Reconexão Automática

Ao iniciar o CLI:
1. Descriptografa e carrega todas as contas salvs
2. Reconecta WebSocket para cada conta
3. Restaura farms persistidos
4. Reaplica RPC salvo

## 📊 Barra de Progresso

Operações destrutivas mostram barra em tempo real:
- Deleção de mensagens
- Saída de servidores
- Contadores de progresso

## 💡 Dicas

- **Backup regularmente**: Use a opção de backup no Clear DMs
- **Teste primeiro**: Selecione DMs específicas antes de "limpar tudo"
- **Múltiplos farms**: Inicie vários farms em servidores diferentes
- **RPC persistente**: Seu status volta quando você reinicia

## 🐛 Troubleshooting

**"Senha incorreta"**
- Você digitou a senha errada
- Limpe o banco: delete `database.sqlite` e `node_modules/.prisma`

**"Token inválido"**
- Token expirou ou está errado
- Gere um novo token Discord

**"Rate-limited"**
- Discord bloqueou sua conta temporariamente
- Aguarde ~15 minutos antes de tentar novamente

**"Conexão recusada"**
- Problema de rede ou Discord indisponível
- Verifique sua internet e tente novamente

## 📝 Licença

MIT - Use por sua conta e risco

---

**⚡ Self by Saint - 216v** | Selfbot Discord CLI | Desenvolvido com TypeScript + Node.js
