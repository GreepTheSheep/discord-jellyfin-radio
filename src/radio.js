const Client = require("discord.js").Client,
    ActivityType = require("discord.js").ActivityType,
    jfClient = require("jellyfin").Client,
    djsVoice = require("@discordjs/voice");

class Radio {
    constructor(client, jf) {
        /** @type {Client} */
        this.client = client;

        /** @type {jfClient} */
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

        /** @type {?import('jellyfin/src/structures/Item')} */
        this.nowPlayingItem = null;

        this.player.on("stateChange", (oldState, newState) => {
            console.log(newState.status);
            if (newState.status == "idle") this.playToPlayer();
        });

        this.player.on("error", (err)=>{
            console.error("Error detected on audio player: " + err.message());
            this.connection.disconnect();
            this.connectToVoiceChannel();
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
        let audioResource = djsVoice.createAudioResource(this.jellyfin.options.baseUrl + "Audio/" + this.nowPlayingItem.id + "/stream", {
            inputType: djsVoice.StreamType.Arbitrary,
        });
        this.player.play(audioResource);

        return djsVoice.entersState(this.player, djsVoice.AudioPlayerStatus.Playing, 5000);
    }

    async stopPlaying() {
        this.player.stop();
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
            this.connection.on("error", (err)=>{
                console.error("Error detected on voice connection: " + err.message());
                this.connection.disconnect();
                this.connectToVoiceChannel();
            });
            return this.connection;
        } catch (error) {
            this.connection.destroy();
            throw error;
        }
    }
}

module.exports = Radio;