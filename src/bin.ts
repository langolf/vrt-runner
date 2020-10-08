#!/usr/bin/env node

import { argv } from 'yargs';
import path from 'path';
import runVrt from './index';

const cwd = (argv.cwd as string) || process.cwd();
const output = (argv.output as string) || path.resolve(cwd, 'result');
const teamcity = !!argv.teamcity;
const scrTime = argv.scrTime as number;
const threshold = argv.threshold as number;

runVrt({
    cwd,
    output,
    teamcity,
    scrTime,
    threshold,
});
