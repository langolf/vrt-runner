#!/usr/bin/env node

import path from 'path';
import yargs from 'yargs';
import runVrt from './index';

const { cwd, output, ...options } = yargs(process.argv.slice(2))
    .options({
        cwd: { type: 'string', default: process.cwd(), demandCommand: true },
        output: {
            type: 'string',
            default: path.resolve(process.cwd(), 'result'),
            demandCommand: true,
        },
        matchingThreshold: { type: 'number', default: 0.05 },
        thresholdRate: { type: 'number' },
        thresholdPixel: { type: 'number' },
        enableAntialias: { type: 'boolean', default: true },
        additionalDetection: { type: 'boolean' },
        concurrency: { type: 'number' },
        ignoreChange: { type: 'boolean', default: true },
    })
    .parserConfiguration({
        'strip-aliased': true,
        'strip-dashed': true,
        'camel-case-expansion': false,
    })
    .strict().argv;

const regCliOptions: [string, any][] = Object.entries(options).slice(1, -1); // yargs extra keys

runVrt({ cwd, output, options: regCliOptions });
