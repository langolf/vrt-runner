#!/usr/bin/env node

import { argv } from 'yargs';
import path from 'path';
import runVrt from './index';

function createRgbArrayFromString(color: string): undefined | [number, number, number] {
    const rgb = color
        .replace(/[[\]]/g, '')
        .split(',')
        .map((item) => parseInt(item))
        .filter((item) => !isNaN(item));

    if (rgb.length !== 3) {
        console.log(
            `warning: color ${color} is not matching scheme of [number, number, number]. It won't be used in options`
        );

        return undefined;
    }

    return rgb as [number, number, number];
}

const cwd = (argv.cwd as string) || process.cwd();
const output = (argv.output as string) || path.resolve(cwd, 'result');
const teamcity = !!argv.teamcity;
const threshold = argv.threshold as undefined | number;
const includeAA = argv.includeAA as undefined | boolean;
const alpha = argv.alpha as undefined | number;
const aaColor = argv.aaColor ? createRgbArrayFromString(argv.aaColor as string) : undefined;
const diffColor = argv.diffColor ? createRgbArrayFromString(argv.diffColor as string) : undefined;
const diffColorAlt = argv.diffColorAlt
    ? createRgbArrayFromString(argv.diffColorAlt as string)
    : undefined;
const diffMask = argv.diffMask as undefined | boolean;
const options = {
    threshold,
    includeAA,
    alpha,
    aaColor,
    diffColor,
    diffColorAlt,
    diffMask,
};

runVrt({
    cwd,
    output,
    teamcity,
    options,
});
