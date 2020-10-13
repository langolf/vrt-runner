import path from 'path';
import generateReport from './report';
import fs from 'fs-extra';
import mkdirp from 'mkdirp';
import execa from 'execa';

export type VRTResultsEntries = {
    failedItems: string[];
    passedItems: string[];
    newItems: string[];
    deletedItems: string[];
};

/** https://github.com/reg-viz/reg-cli#options */
export type VRTCommandOptions = {
    matchingThreshold?: number;
    thresholdRate?: number;
    thresholdPixel?: number;
    enableAntialias?: boolean;
    additionalDetection?: boolean;
    concurrency?: number;
    ignoreChange?: boolean;
};

function setVrtOptions(options: VRTCommandOptions): string[] {
    const defaultOptions: VRTCommandOptions = {
        matchingThreshold: 0.05,
        enableAntialias: true,
        ignoreChange: true,
    };

    return Object.entries({ ...defaultOptions, ...options }).map(
        (item) => `--${item[0]}=${item[1]}`
    );
}

export default async function runVrt({
    output,
    cwd,
    options,
}: {
    output: string;
    cwd: string;
    options: VRTCommandOptions;
}) {
    const dirs = {
        baseline: path.resolve(output, 'baseline'),
        test: path.resolve(output, 'test'),
        diff: path.resolve(output, 'diff'),
    };

    const reportPage = path.resolve(output, 'index.html');
    const vrtCommandReportFile = path.relative(
        process.cwd(),
        path.resolve(output, 'diff-report.json')
    );

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

    try {
        let cmpTime = Date.now();

        execa.sync(
            'reg-cli',
            [
                dirs.test,
                dirs.baseline,
                dirs.diff,
                `--json=${vrtCommandReportFile}`,
                ...setVrtOptions(options),
            ],
            {
                stdout: process.stdout,
            }
        );

        cmpTime = Date.now() - cmpTime;
        console.info(`Diff time: ${cmpTime / 1000} s.`);

        const diffResultData: VRTResultsEntries = JSON.parse(
            fs.readFileSync(vrtCommandReportFile, 'utf8')
        );

        generateReport(reportPage, diffResultData);

        console.info('Report generated to', reportPage);
        process.exit(0);
    } catch (error) {
        console.error(`Comparing images error: \n${error.stack || error}`);
        process.exit(1);
    }
}
