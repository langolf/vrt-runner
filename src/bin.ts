#!/usr/bin/env node

import { argv } from 'yargs';
import path from 'path';
import runVrt from './index';

const cwd = (argv.cwd as string) || process.cwd();
const output = (argv.output as string) || path.resolve(cwd, 'result');
const teamcity = !!argv.teamcity;
const threshold = argv.threshold as number;
const includeAA = argv.threshold as boolean;
const alpha = argv.threshold as number;
const aaColor = argv.threshold as [number, number, number];
const diffColor = argv.threshold as [number, number, number];
const diffColorAlt = argv.threshold as [number, number, number];
const diffMask = argv.threshold as boolean;
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
