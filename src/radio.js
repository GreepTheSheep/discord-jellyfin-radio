const Client = require("discord.js").Client,
    ActivityType = require("discord.js").ActivityType,
    ChannelType =  require("discord.js").ChannelType,
    jfClient = require("jellyfin").Client,
    djsVoice = require("@discordjs/voice");

class Radio {
    constructor(client, jf) {
        /** @type {Client} */
        this.client = client;

        /** @type {import('jellyfin/typings/client/Client')} */
        this.jellyfin = jf;

        /** @type {djsVoice.AudioPlayer} */
        this.player = djsVoice.createAudioPlayer({
            behaviors: {
                noSubscriber: djsVoice.NoSubscriberBehavior.Play,
                maxMissedFrames: Math.round(5000 / 20),
            },
        });

        /** @type {?djsVoice.VoiceConnection} */
        this.connection = null;

        /** @type {?import('jellyfin/typings/structures/Item')} */
        this.nowPlayingItem = null;

        this.player.on("stateChange", (oldState, newState) => {
            console.log(newState.status);
            if (newState.status == "idle") this.playToPlayer();
        });

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
        let views = await this.jellyfin.getItems({
            mediaTypes: "Audio",
            sortBy: "Random",
            limit: 1
        });
        this.nowPlayingItem = views[0];
        console.log(this.nowPlayingItem.artists.join(", ") + " - " + this.nowPlayingItem.name);
        this.client.user.setActivity({name: this.nowPlayingItem.artists.join(", ") + " - " + this.nowPlayingItem.name, type: ActivityType.Playing});
        let streamUrl = (
            `${this.jellyfin.options.baseUrl}audio` +
            `/${this.nowPlayingItem.id}/universal` +
            `?userId=${this.jellyfin.user.id}` +
            `&deviceId=${this.jellyfin.sessionInfo.deviceId}` +
            `&audioCodec=aac` +
            `&apiKey=${this.jellyfin.accessToken}` +
            `&playSessionId=${this.jellyfin.sessionInfo.deviceId}` +
            '&container=opus,mp3,aac,m4a,m4b,flac,wav,ogg' +
            '&transcodingContainer=ts' +
            '&transcodingProtocol=http'
        );
        let audioResource = djsVoice.createAudioResource(streamUrl, {
            inputType: djsVoice.StreamType.Arbitrary,
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

module.exports = Radio;