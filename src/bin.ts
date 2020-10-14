#!/usr/bin/env node

import yargs = require('yargs');
import path from 'path';
import runVrt from './index';

export interface VrtOptions {
    cwd: string;
    output: string;
    matchingThreshold?: number;
    thresholdRate?: number;
    thresholdPixel?: number;
    enableAntialias?: boolean;
    additionalDetection?: boolean;
    concurrency?: number;
    ignoreChange?: boolean;
}

const argv: VrtOptions = yargs(process.argv.slice(2))
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

console.log(argv);

runVrt(argv);
