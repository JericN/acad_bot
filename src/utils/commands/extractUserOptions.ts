import { assert, assertDefined } from '../assert';
import type { CommandInteraction } from 'discord.js';
import { CommandOption } from '../schema';

type RawValue = string | number | boolean;

type FormatValue = {
    name: string;
    value: RawValue | string[];
};

type UserOptions = Record<string, FormatValue>;

function formatValue(option: CommandOption, inputValue: RawValue): FormatValue {
    let name: string;
    let value: RawValue | string[];

    // WARNING: Future implementation for other option should be handled here
    if (option.name === 'subjects') {
        assert(typeof inputValue === 'string', 'Subjects should be a string');
        name = inputValue || 'All';
        value = inputValue.split(' ').filter((s) => s.toLowerCase());
    } else {
        const choice = option.choices?.find((c) => c.value === inputValue);
        assertDefined(choice, `Undefined choice for option ${option.name}`);
        ({ name } = choice);
        value = inputValue;
    }

    return { name, value };
}

export function extractUserOptions<T>(interaction: CommandInteraction, options: CommandOption[]): T {
    const userOptions: UserOptions = {};

    for (const option of options) {
        const inputValue = interaction.options.get(option.name)?.value ?? option.default;
        assertDefined(inputValue, `Undefined value for option ${option.name}`);
        userOptions[option.name] = formatValue(option, inputValue);
    }

    return userOptions as T;
}
