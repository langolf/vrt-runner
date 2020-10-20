#!/usr/bin/env node

import { argv } from 'yargs';
import path from 'path';
import runVrt from './index';

const cwd = (argv.cwd as string) || process.cwd();
const output = (argv.output as string) || path.resolve(cwd, 'result');
const teamcity = !!argv.teamcity;
// higher then 0.05 will cause a fail
const matchingThreshold = (argv.matchingThreshold as number) || 0.05;
const thresholdRate = argv.thresholdRate as number | undefined;
const thresholdPixel = argv.thresholdPixel as number | undefined;
const enableAntialias = (argv.enableAntialias as boolean) || true;
const additionalDetection = argv.additionalDetection as boolean | undefined;
const concurrency = argv.concurrency as number | undefined;
const ignoreChange = (argv.ignoreChange as boolean) || true;

runVrt({
    cwd,
    output,
    teamcity,
    options: {
        matchingThreshold,
        thresholdRate,
        thresholdPixel,
        enableAntialias,
        additionalDetection,
        concurrency,
        ignoreChange,
    },
});
