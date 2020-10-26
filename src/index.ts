import path from 'path';
import diffDirs, { DirsType, DiffResult } from './compare';
import generateReport from './report';
import fs from 'fs-extra';
import mkdirp from 'mkdirp';

interface BuildOptions {
    cwd: string;
    output: string;
    teamcity: boolean | undefined;
}

interface VrtToolOptions {
    matchingThreshold: number | undefined;
    thresholdRate: number | undefined;
    thresholdPixel: number | undefined;
    enableAntialias: boolean | undefined;
    additionalDetection: number | undefined;
    concurrency: number | undefined;
    ignoreChange: boolean | undefined;
}

type CommandOptions = BuildOptions & VrtToolOptions;

const showResults = ({
    failedItems,
    passedItems,
    diffTime,
}: {
    failedItems: number;
    passedItems: number;
    diffTime: number;
}) => {
    const results = `
    ==================
    Tests failed: ${failedItems}
    Tests passed: ${passedItems}
    Diff time: ${diffTime} s.
    `;

    return results;
};

// type onVrtCompleteType = (result: DiffResult, cmpTime: number) => void;
//
// const onVrtCompleteDefaultAction: onVrtCompleteType = (result, cmpTime) => {
//     const info = showResults({
//         failedItems: result.failedItems.length + result.deletedItems.length,
//         passedItems: result.passedItems.length + result.newItems.length,
//         diffTime: cmpTime / 1000,
//     });
//
//     console.info(info);
// };

export default async function runVrt(o: CommandOptions) {
    const { cwd, output, teamcity, ...rest } = o;
    const options = { ...rest };

    const reportFile = path.resolve(output, 'index.html');

    const dirs: DirsType = {
        baseline: path.resolve(output, 'baseline'),
        test: path.resolve(output, 'test'),
        diff: path.resolve(output, 'diff'),
    };

    // Ensure test dirs exists
    mkdirp.sync(dirs.baseline);
    mkdirp.sync(dirs.test);
    mkdirp.sync(dirs.diff);

    // Copy files to result first
    fs.copySync(path.resolve(__dirname, 'report-assets'), path.resolve(output));

    if (output !== cwd) {
        fs.copySync(path.resolve(cwd, 'baseline'), dirs.baseline);
        fs.copySync(path.resolve(cwd, 'test'), dirs.test);
    }

    // Collect images from baseline and testing paths
    try {
        // Compare
        console.info(`Comparing images...`);
        let cmpTime = Date.now();
        const result = await diffDirs({
            output,
            dirs,
            options,
        });
        cmpTime = Date.now() - cmpTime;

        // if (onVrtComplete) {
        //     onVrtComplete(result, cmpTime);
        // } else {
        //     onVrtCompleteDefaultAction(result, cmpTime);
        // }

        generateReport(reportFile, result);
        console.info('Report generated to', reportFile);
        process.exit(0);
    } catch (error) {
        console.error(`Comparing images error: \n${error.stack || error}`);
        process.exit(1);
    }
}
