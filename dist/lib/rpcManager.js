export class RPCManager {
    setSpotifyRPC(userClient, trackName, artistName) {
        userClient.setPresence({
            activities: [
                {
                    name: `${trackName} - ${artistName}`,
                    type: 2, // LISTENING
                    assets: {
                        large_image: "spotify:0",
                    },
                },
            ],
            status: "online",
        });
    }
    setGameRPC(userClient, gameName, duration) {
        userClient.setPresence({
            activities: [
                {
                    name: gameName,
                    type: 0, // PLAYING
                    details: duration ? `Jogando há ${duration}` : undefined,
                },
            ],
            status: "online",
        });
    }
    setTwitchRPC(userClient, twitchLink, channelName) {
        userClient.setPresence({
            activities: [
                {
                    name: `${channelName}`,
                    type: 1, // STREAMING
                    url: twitchLink,
                    assets: {
                        large_image: "twitch:1",
                    },
                },
            ],
            status: "online",
        });
    }
    setCustomStatus(userClient, text, emoji, duration) {
        userClient.setPresence({
            activities: [
                {
                    name: emoji ? `${emoji} ${text}` : text,
                    type: 4, // CUSTOM
                    state: duration ? `por ${duration}` : undefined,
                },
            ],
            status: "online",
        });
    }
    clearPresence(userClient) {
        userClient.setPresence({
            activities: [],
            status: "online",
        });
    }
    buildRPCDetails(type, name, link, emoji, duration) {
        return {
            type,
            name,
            link,
            emoji,
            duration,
            startedAt: Date.now(),
        };
    }
}
//# sourceMappingURL=rpcManager.js.map