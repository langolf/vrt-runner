import path from 'path';
import { DirsType, DiffResult } from './types';
import { diffDirs } from './compare';
import createReport from './report';
import fs from 'fs-extra';
import log from './log';
import { PixelmatchOptions } from 'pixelmatch';

const IS_DEBUG = process.env.NODE_ENV === 'debug';

type onVrtCompleteType = (result: DiffResult, cmpTime: number) => void;

const onVrtCompleteDefaultAction: onVrtCompleteType = (result, cmpTime) => {
    log.fail(`\nTests failed: ${result.failed.length}`);
    log.success(`Tests passed: ${result.passed.length} \n `);
    log.info(`Diff time: ${cmpTime / 1000}s`);
};

export default async function runVrt({
    teamcity,
    output,
    cwd,
    onVrtComplete,
    options,
}: {
    teamcity: boolean;
    output: string;
    cwd: string;
    onVrtComplete?: onVrtCompleteType;
    options?: PixelmatchOptions;
}): Promise<DiffResult> {
    const dirs: DirsType = {
        baselineDir: path.resolve(output, 'baseline'),
        testDir: path.resolve(output, 'test'),
        diffDir: path.resolve(output, 'diff'),
        outputDir: path.resolve(output),
    };

    // Folder checking are subject to move to our core vrt package
    // as it has knowledge of structure
    fs.ensureDirSync(dirs.baselineDir);
    fs.ensureDirSync(dirs.testDir);
    fs.ensureDirSync(dirs.diffDir);

    if (output !== cwd) {
        fs.copySync(path.resolve(cwd, 'baseline'), dirs.baselineDir);
        fs.copySync(path.resolve(cwd, 'test'), dirs.testDir);
    }

    try {
        IS_DEBUG && log.info(`\nComparing images...\n`);
        let cmpTime = Date.now();
        const result = await diffDirs({
            dirs,
            teamcity,
            options,
        });
        cmpTime = Date.now() - cmpTime;

        if (onVrtComplete) {
            onVrtComplete(result, cmpTime);
        } else {
            onVrtCompleteDefaultAction(result, cmpTime);
        }

        await createReport({ ...result, ...dirs });
        IS_DEBUG && console.info(`Finished.`);
        process.exit(0);
    } catch (error) {
        console.error(`Comparing images error: \n${error.stack || error}`);
        process.exit(1);
    }
}
