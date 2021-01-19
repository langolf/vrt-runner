#!/usr/bin/env node

import yargs from 'yargs';
import path from 'path';
import runVrt from './index';

const {
    cwd,
    output,
    teamcity,
    threshold,
    includeAA,
    alpha,
    aaColor,
    diffColor,
    diffColorAlt,
    diffMask,
} = yargs(process.argv.slice(2))
    .options({
        cwd: {
            alias: 'c',
            type: 'string',
            demandOption: true,
            default: process.cwd(),
            normalize: true,
        },
        output: {
            alias: 'o',
            type: 'string',
            demandOption: true,
            default: path.resolve(process.cwd(), 'result'),
            normalize: true,
        },
        teamcity: { type: 'string', default: false },

        // Pixelmatch optios
        threshold: { type: 'number', default: 0.1 },
        includeAA: { type: 'boolean', default: false },
        alpha: { type: 'number' },
        aaColor: { type: 'string' },
        diffColor: { type: 'string' },
        diffColorAlt: { type: 'string' },
        diffMask: { type: 'boolean' },
    })
    .coerce(['aaColor', 'diffColor', 'diffColorAlt'], (value: string) => {
        const rgb = value
            .replace(/[[\]]/g, '')
            .split(',')
            .map((value) => parseInt(value))
            .filter((value) => !isNaN(value));

        if (rgb.length !== 3) {
            console.log(
                `warning: color ${value} is not matching scheme of [number, number, number]. It won't be used in options`
            );

            return undefined;
        }

        return rgb as [number, number, number];
    })
    .strict().argv;

runVrt({
    cwd,
    output,
    teamcity,
    options: { threshold, includeAA, alpha, aaColor, diffColor, diffColorAlt, diffMask },
});
