import path from 'path';
import diffDirs, { DirsType, DiffResult, ComparisonOptionsType } from './compare';
import createReport from './report';
import fs from 'fs-extra';
import log from './log';

const IS_DEBUG = process.env.NODE_ENV === 'debug';

type onVrtCompleteType = (result: DiffResult, cmpTime: number) => void;

const onVrtCompleteDefaultAction: onVrtCompleteType = (result, cmpTime) => {
    log.fail(`Tests failed: ${result.failed.length}`);
    log.success(`Tests passed: ${result.passed.length} \n `);
    IS_DEBUG && log.info(`Diff time: ${cmpTime / 1000}s`);
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
    options?: ComparisonOptionsType;
}) {
    const dirs: DirsType = {
        baselineDir: path.resolve(output, 'baseline'),
        testDir: path.resolve(output, 'test'),
        diffDir: path.resolve(output, 'diff'),
        outputDir: path.resolve(output),
    };

    fs.emptyDirSync(output);

    // Ensure test dirs exists
    fs.ensureDirSync(dirs.baselineDir);
    fs.ensureDirSync(dirs.testDir);
    fs.ensureDirSync(dirs.diffDir);

    if (output !== cwd) {
        fs.copySync(path.resolve(cwd, 'baseline'), dirs.baselineDir);
        fs.copySync(path.resolve(cwd, 'test'), dirs.testDir);
    }

    // Collect images from baseline and testing paths
    try {
        // Compare
        IS_DEBUG && log.info(`Comparing images...`);
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
