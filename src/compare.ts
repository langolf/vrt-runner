import fs from 'fs';
import path from 'path';
import execa from 'execa';

export type ComparisonOptionsType = {
    matchingThreshold?: number;
    thresholdRate?: number;
    thresholdPixel?: number;
    enableAntialias?: boolean;
    additionalDetection?: boolean;
    concurrency?: number;
    ignoreChange?: boolean;
};

export type DiffResult = {
    failedItems: string[];
    passedItems: string[];
    newItems: string[];
    deletedItems: string[];
};

type diffDirsType = {
    output: string;
    dirs: DirsType;
    teamcity: boolean;
    options: ComparisonOptionsType;
};
// For every .png or .jpg file in baseline directory:
// - will try to find file with the same name in test directory
// - if found, will create a diff file in diff directory
// options.baseline {String} - baseline directory
// options.test {String} - test directory
// options.diff {String} - diff directory
async function diffDirs({ output, dirs, teamcity, options }: diffDirsType) {
    const vrtCommandReportFile = path.relative(
        process.cwd(),
        path.resolve(output, 'diff-report.json')
    );

    function teamcityMessage(message: string) {
        if (teamcity) {
            console.info(`##teamcity[${message}]`);
        }
    }

    const flags = Object.entries(options).map(([key, value]) => `--${key}=${value}`);

    execa.sync(
        'reg-cli',
        [dirs.test, dirs.baseline, dirs.diff, `--json=${vrtCommandReportFile}`, ...flags],
        {
            stdout: process.stdout,
            preferLocal: true,
        }
    );

    teamcityMessage(`testSuiteStarted name='VRT'`);

    const result: DiffResult = JSON.parse(fs.readFileSync(vrtCommandReportFile, 'utf8'));

    if (result.failedItems.length > 0) {
        for (const file of result.failedItems) {
            teamcityMessage(
                `testFailed name='${file}' message='sandbox screenshots are different' details=''`
            );
        }
    }

    if (result.deletedItems.length > 0) {
        for (const file of result.deletedItems) {
            teamcityMessage(
                `testFailed name='${file}' message='sandbox screenshots are missing' details=''`
            );
        }
    }
    teamcityMessage(`testSuiteFinished name='VRT'`);

    return result;
}

export default diffDirs;

export type DirsType = {
    baseline: string;
    test: string;
    diff: string;
};
