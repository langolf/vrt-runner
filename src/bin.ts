#!/usr/bin/env node

import yargs from 'yargs';
import path from 'path';
import runVrt from './index';

const args = yargs(process.argv.slice(2))
    .option('cwd', {
        alias: 'in',
        type: 'string',
        demandOption: true,
        default: process.cwd(),
        normalize: true,
    })
    .option('output', {
        alias: 'out',
        type: 'string',
        demandOption: true,
        default: path.resolve(process.cwd(), 'result'),
        normalize: true,
    })
    .option('teamcity', { alias: 't', type: 'string', default: false })
    // Pixelmatch optios
    .option('threshold', { type: 'number', default: 0.1 })
    .option('includeAA', { type: 'boolean', default: false })
    .option('alpha', { type: 'number' })
    .option('aaColor', { type: 'string' })
    .option('diffColor', { type: 'string' })
    .option('diffColorAlt', { type: 'string' })
    .option('diffMask', { type: 'boolean' })
    .coerce(['aaColor', 'diffColor', 'diffColorAlt'], (value: string) => {
        if (!value) {
            return;
        }
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
    .wrap(120).argv;

const { cwd, output, teamcity, ...options } = args;

runVrt({
    cwd,
    output,
    teamcity,
    options,
});
