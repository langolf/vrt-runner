#!/usr/bin/env node

import yargs from 'yargs';
import path from 'path';
import runVrt from './index';

const { cwd, output, teamcity, _, $0, ...options } = yargs(process.argv.slice(2))
    .options({
        cwd: { type: 'string', demandOption: true, default: process.cwd() },
        output: {
            type: 'string',
            demandOption: true,
            default: path.resolve(process.cwd(), 'output'),
        },
        teamcity: { type: 'string', default: false },
        // higher then 0.05 will cause a fail
        matchingThreshold: { type: 'number', default: 0.05 },
        thresholdRate: { type: 'number' },
        thresholdPixel: { type: 'number' },
        enableAntialias: { type: 'boolean', default: true },
        additionalDetection: { type: 'boolean' },
        concurrency: { type: 'number' },
        ignoreChange: { type: 'boolean', default: true },
    })
    .strict()
    .parserConfiguration({ 'camel-case-expansion': false }).argv;

runVrt({
    cwd,
    output,
    teamcity,
    options,
});
