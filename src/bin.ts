#!/usr/bin/env node

import yargs from 'yargs';
import path from 'path';
import runVrt from './index';

const args = yargs
    .options({
        cwd: {
            type: 'string',
            default: process.cwd(),
            demandOption: true,
        },
        output: {
            type: 'string',
            default: path.resolve(process.cwd(), 'output'),
            demandOption: true,
        },
        teamcity: { type: 'boolean', default: false },
        matchingThreshold: { type: 'number', default: 0.05 },
        thresholdRate: { type: 'number' },
        thresholdPixel: { type: 'number' },
        enableAntialias: { type: 'boolean', default: true },
        additionalDetection: { type: 'number' },
        concurrency: { type: 'number' },
        ignoreChange: { type: 'boolean', default: true },
    })
    .parserConfiguration({ 'camel-case-expansion': false })
    .strict().argv;

runVrt(args);
