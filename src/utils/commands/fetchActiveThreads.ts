import { CommandInteraction, TextChannel, ThreadChannel } from 'discord.js';
import { assertDefined } from '../assert';

type ThreadRecord = Record<string, ThreadChannel>;
export async function fetchActiveThreads(channelName: string, interaction: CommandInteraction): Promise<ThreadRecord> {
    // Fetch the channel from the guild
    const guildChannels = interaction.guild?.channels.cache;
    assertDefined(guildChannels, 'Guild channels not found');
    const channel = guildChannels.find((ch) => ch.type === 0 && ch.name === channelName) as TextChannel;
    assertDefined(channel, `Channel ${channelName} not found`);

    // Make archived threads active to make it fetchable
    const archivedThreads = await channel.threads.fetchArchived();
    archivedThreads.threads.forEach(async (thread) => {
        if (thread.archived) await thread.setArchived(false);
    });

    // Fetch active threads
    const activeThreads = await channel.threads.fetchActive();
    if (activeThreads.threads.size === 0) throw new Error(`No active threads found in ${channelName}`);

    // Create a map of threads
    const threads: ThreadRecord = {};
    activeThreads.threads.forEach((thread) => {
        const name = thread.name.replace(/[^a-z0-9]/gi, '').toLowerCase();
        threads[name] = thread;
    });

    return threads;
}
