import { Client, ActivityType, ChannelType } from "discord.js";
import * as djsVoice from "@discordjs/voice";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api.js";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind.js";
import { ItemSortBy } from "@jellyfin/sdk/lib/generated-client/models/item-sort-by.js";

class Radio {
    constructor(client, api, user) {
        /** @type {Client} */
        this.client = client;

        /** @type {import('@jellyfin/sdk/lib/api.js').Api} */
        this.jellyfin = api;

        /** @type {import('@jellyfin/sdk/lib/generated-client/models/user-dto.js').UserDto} */
        this.user = user;

        /** @type {djsVoice.AudioPlayer} */
        this.player = djsVoice.createAudioPlayer({
            behaviors: {
                noSubscriber: djsVoice.NoSubscriberBehavior.Play,
                maxMissedFrames: Math.round(5000 / 20),
            },
        });

        /** @type {?djsVoice.VoiceConnection} */
        this.connection = null;

        /** @type {?import('@jellyfin/sdk/lib/generated-client/models/base-item-dto.js').BaseItemDto} */
        this.nowPlayingItem = null;

        /** @type {Array<{item: import('@jellyfin/sdk/lib/generated-client/models/base-item-dto.js').BaseItemDto, userId: string, userName: string}>} */
        this.queue = [];

        /** @type {Map<string, {timestamp: number, results: import('@jellyfin/sdk/lib/generated-client/models/base-item-dto.js').BaseItemDto[]}>} */
        this.searchCache = new Map();

        /** @type {boolean} */
        this.isRadioMode = true;

        this.player.on("stateChange", (oldState, newState) => {
            console.log("> " + newState.status);
        });

        this.player.on(djsVoice.AudioPlayerStatus.Idle, () => {
            this.playToPlayer();
        });

        /*
        this.player.on('debug', message => {
            console.log('Player debug:', message);
        });
        */

        this.player.on("error", (err)=>{
            console.error("Error detected on audio player: " + err.message);
            if (this.connection) this.connection.rejoin();
            this.playToPlayer();
        });

        this.client.on("messageCreate", msg=>{
            if (msg.channel.id == process.env.VOICE_CHANNEL) {
                setTimeout(()=>{
                    if (msg && msg.deletable) msg.delete().catch(err=>console.error("Can't delete message", msg.id, err));
                }, 5 * 60 * 1000); // 5 minutes
            }
        });
    }

    async playToPlayer() {
        if (this.queue.length > 0) {
            const queued = this.queue.shift();
            this.nowPlayingItem = queued.item;
            this.isRadioMode = false;
            console.log("[QUEUE] " + this.nowPlayingItem.Artists?.join(", ") + " - " + this.nowPlayingItem.Name + " [" + this.nowPlayingItem.Album + "] (id: " + this.nowPlayingItem.Id + ")");
        } else {
            const { data } = await getItemsApi(this.jellyfin).getItems({
                userId: this.user.Id,
                includeItemTypes: [BaseItemKind.Audio],
                recursive: true,
                sortBy: [ItemSortBy.Random],
                limit: 1
            });
            this.nowPlayingItem = data.Items?.[0];
            if (this.nowPlayingItem == undefined) return this.playToPlayer();
            this.isRadioMode = true;
            console.log(this.nowPlayingItem.Artists?.join(", ") + " - " + this.nowPlayingItem.Name + " [" + this.nowPlayingItem.Album + "] (id: " + this.nowPlayingItem.Id + ")");
        }
        this.client.user.setActivity({name: this.nowPlayingItem.Artists?.join(", ") + " - " + this.nowPlayingItem.Name, type: ActivityType.Playing});
        let streamUrl = (
            `${this.jellyfin.basePath}/audio` +
            `/${this.nowPlayingItem.Id}/universal` +
            `?userId=${this.user.Id}` +
            `&deviceId=${this.jellyfin.deviceInfo.id}` +
            `&audioCodec=aac` +
            `&apiKey=${this.jellyfin.accessToken}` +
            `&playSessionId=${this.jellyfin.deviceInfo.id}` +
            '&container=opus,mp3,aac,m4a,m4b,flac,wav,ogg' +
            '&transcodingContainer=ts' +
            '&transcodingProtocol=http'
        );

        try {
            const response = await this.jellyfin.axiosInstance.get(streamUrl, {
                responseType: 'stream',
                timeout: 30000
            });
            let audioResource = djsVoice.createAudioResource(response.data, {
                inputType: djsVoice.StreamType.Arbitrary,
                metadata: {
                    title: this.nowPlayingItem.Name,
                    artist: this.nowPlayingItem.Artists?.join(", "),
                    album: this.nowPlayingItem.Album,
                    id: this.nowPlayingItem.Id
                }
            });
            this.player.play(audioResource);
            //this.jellyfin.playstate.reportItemPlayed(this.nowPlayingItem.id, "DirectStream");

            return djsVoice.entersState(this.player, djsVoice.AudioPlayerStatus.Playing, 5000);
        } catch (err) {
            console.error("Error loading track (" + this.nowPlayingItem.Name + "): " + (err.response?.status || err.message));
            await new Promise(r => setTimeout(r, 1000));
            return this.playToPlayer();
        }
    }

    async stopPlaying() {
        this.player.stop();
        //this.jellyfin.playstate.reportItemStopped(this.nowPlayingItem.id);
        return djsVoice.entersState(this.player, djsVoice.AudioPlayerStatus.Idle, 5000);
    }

    async searchItems(query) {
        const now = Date.now();
        for (const [key, value] of this.searchCache) {
            if (now - value.timestamp > 5 * 60 * 1000) {
                this.searchCache.delete(key);
            }
        }

        const { data } = await getItemsApi(this.jellyfin).getItems({
            userId: this.user.Id,
            includeItemTypes: [BaseItemKind.Audio],
            recursive: true,
            searchTerm: query,
            limit: 5
        });

        const results = data.Items ?? [];
        return results;
    }

    addToQueue(item, userId, userName) {
        this.queue.push({ item, userId, userName });
    }

    removeFromQueue(index) {
        if (index < 0 || index >= this.queue.length) {
            throw new Error("Index out of queue bounds");
        }
        return this.queue.splice(index, 1)[0];
    }

    clearQueue() {
        this.queue = [];
    }

    getQueue() {
        return this.queue;
    }

    async connectToVoiceChannel() {
        let channel = await this.client.channels.fetch(process.env.VOICE_CHANNEL);
        if (!channel.isVoiceBased()) throw "This channel is not Voice Based";

        this.connection = djsVoice.joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator
        });

        try {
            await djsVoice.entersState(this.connection, djsVoice.VoiceConnectionStatus.Ready, 30_000);
            if (channel.type == ChannelType.GuildStageVoice) {
                channel.guild.members.me.voice.setSuppressed(false);
            }
            this.connection.on('debug', message => {
                console.log('Connection debug:', message);
            });
            this.connection.on("error", (err)=>{
                console.error("Error detected on voice connection: " + err.message());
                this.connection.rejoin();
            });
            return this.connection;
        } catch (error) {
            this.connection.rejoin();
            throw error;
        }
    }
}

export default Radio;
