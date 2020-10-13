#!/usr/bin/env node

import { argv } from 'yargs';
import path from 'path';
import runVrt from './index';
import { VRTCommandOptions } from './index';

const cwd = (argv.cwd as string) || process.cwd();
const output = (argv.output as string) || path.resolve(cwd, 'result');
const options = (argv.options as VRTCommandOptions) || {};

runVrt({
    cwd,
    output,
    options,
});
