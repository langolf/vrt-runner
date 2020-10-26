import fs from 'fs';
import path from 'path';
import execa from 'execa';

export type DiffResult = {
    failedItems: string[];
    passedItems: string[];
    newItems: string[];
    deletedItems: string[];
};

type diffDirsType = {
    output: string;
    dirs: DirsType;
    options: any;
};
// For every .png or .jpg file in baseline directory:
// - will try to find file with the same name in test directory
// - if found, will create a diff file in diff directory
// options.baseline {String} - baseline directory
// options.test {String} - test directory
// options.diff {String} - diff directory
async function diffDirs({ output, dirs, options }: diffDirsType) {
    const vrtCommandReportFile = path.relative(
        process.cwd(),
        path.resolve(output, 'diff-report.json')
    );

    function teamcityMessage(message: string) {
        console.info(`##teamcity[${message}]`);
    }

    try {
        teamcityMessage(`testSuiteStarted name='VRT'`);

        await execa(
            'reg-cli',
            [dirs.test, dirs.baseline, dirs.diff, `--json=${vrtCommandReportFile}`, ...options],
            {
                stdout: process.stdout,
                stderr: process.stderr,
            }
        );

        teamcityMessage(`testSuiteFinished name='VRT'`);
    } catch (error) {
        console.error(error);
    }

    try {
        const results = JSON.parse(fs.readFileSync(vrtCommandReportFile, 'utf8'));
        return results;
    } catch (error) {
        console.info(`JSON report file didn't exist`);
        console.error(error);
    }
}

export default diffDirs;

export type DirsType = {
    baseline: string;
    test: string;
    diff: string;
};
