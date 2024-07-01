import { z } from 'zod';

const PossibleValues = z.union([z.string(), z.number(), z.boolean()]);

export const LocalCommand = z.object({
    deleted: z.boolean(),
    devOnly: z.boolean(),
    allowedServerOnly: z.boolean(),
    name: z.string(),
    description: z.string(),
    options: z.array(z.unknown()),
    callback: z.function().args(z.unknown()).returns(z.unknown()),
});
export type LocalCommand = z.infer<typeof LocalCommand>;

export const AcadEvent = z.object({
    calendarId: z.string(),
    subject: z.string(),
    summary: z.string(),
    startDate: z.date(),
    endDate: z.date(),
});
export type AcadEvent = z.infer<typeof AcadEvent>;

export const DiscordEvent = z.object({
    events: z.array(AcadEvent),
    text: z.string(),
    messageId: z.string(),
    threadId: z.string(),
    guildId: z.string(),
});

export type DiscordEvent = z.infer<typeof DiscordEvent>;

export const FilteredEvents = z.object({
    validEvents: z.array(AcadEvent),
    invalidEvents: z.array(AcadEvent),
});
export type FilteredEvents = z.infer<typeof FilteredEvents>;

export const GroupedEvents = z.record(z.array(AcadEvent));
export type GroupedEvents = z.infer<typeof GroupedEvents>;

export const EventLog = z.object({
    timestamp: z.date(),
    subject: z.string(),
    summary: z.string(),
    calendarId: z.string(),
    messageId: z.string(),
    threadId: z.string(),
    guildId: z.string(),
});
export type EventLog = z.infer<typeof EventLog>;

export const CommandOption = z.object({
    name: z.string(),
    description: z.string(),
    type: z.number(),
    required: z.boolean(),
    choices: z.array(z.object({ name: z.string(), value: PossibleValues })).optional(),
    default: PossibleValues,
});
export type CommandOption = z.infer<typeof CommandOption>;

export const ListOptions = z.object({
    span: z.object({
        name: z.string(),
        value: z.number(),
    }),
    start: z.object({
        name: z.string(),
        value: z.string(),
    }),
    group: z.object({
        name: z.string(),
        value: z.string(),
    }),
});
export type ListOptions = z.infer<typeof ListOptions>;

export const SendOptions = z.object({
    span: z.object({
        name: z.string(),
        value: z.number(),
    }),
    start: z.object({
        name: z.string(),
        value: z.string(),
    }),
    force: z.object({
        name: z.string(),
        value: z.number(),
    }),
    subjects: z.object({
        name: z.string(),
        value: z.array(z.string()),
    }),
});
export type SendOptions = z.infer<typeof SendOptions>;
