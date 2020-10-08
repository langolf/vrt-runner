#!/usr/bin/env node

import { argv } from 'yargs';
import path from 'path';
import runVrt from './index';

const cwd = (argv.cwd as string) || process.cwd();
const output = (argv.output as string) || path.resolve(cwd, 'result');
const teamcity = !!argv.teamcity;
const threshold = argv.threshold as undefined | number;
const includeAA = argv.includeAA as undefined | boolean;
const alpha = argv.alpha as undefined | number;
const aaColor = argv.aaColor as undefined | [number, number, number];
const diffColor = argv.diffColor as undefined | [number, number, number];
const diffColorAlt = argv.diffColorAlt as undefined | [number, number, number];
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
