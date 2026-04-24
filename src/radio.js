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
            console.error("Error detected on audio player: " + err.message());
            this.connection.rejoin();
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
        const { data } = await getItemsApi(this.jellyfin).getItems({
            userId: this.user.Id,
            includeItemTypes: [BaseItemKind.Audio],
            recursive: true,
            sortBy: [ItemSortBy.Random],
            limit: 1
        });
        this.nowPlayingItem = data.Items?.[0];
        if (this.nowPlayingItem == undefined) return this.playToPlayer();
        console.log(this.nowPlayingItem.Artists?.join(", ") + " - " + this.nowPlayingItem.Name + " [" + this.nowPlayingItem.Album + "] (id: " + this.nowPlayingItem.Id + ")");
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
        let audioResource = djsVoice.createAudioResource(streamUrl, {
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
    }

    async stopPlaying() {
        this.player.stop();
        //this.jellyfin.playstate.reportItemStopped(this.nowPlayingItem.id);
        return djsVoice.entersState(this.player, djsVoice.AudioPlayerStatus.Idle, 5000);
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
