import path from 'path';
import generateReportTemplate from './report';
import fs from 'fs-extra';
import mkdirp from 'mkdirp';
import execa from 'execa';

// Special log messages for TeamCity service. Using by other platforms
function teamcityLogger(message: string) {
    console.info(`##teamcity[${message}]`);
}

export default async function runVrt({
    output,
    cwd,
    options,
}: {
    output: string;
    cwd: string;
    teamcity: boolean;
    options: [string, any][];
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
        teamcityLogger(`testSuiteStarted name='VRT'`);
        let cmpTime = Date.now();

        // we have to convert to strings
        // const regFlags = options.map((option) => option.map((item) => `--${item[0]}=${item[1]}`));
        const flags = options.map(([key, value]) => `--${key}=${value}`);

        execa.sync(
            'reg-cli',
            [dirs.test, dirs.baseline, dirs.diff, `--json=${vrtCommandReportFile}`, ...flags],
            {
                stdout: process.stdout,
            }
        );

        cmpTime = Date.now() - cmpTime;
        console.info(`Diff time: ${cmpTime / 1000} s.`);
        teamcityLogger(`testSuiteFinished name='VRT'`);

        const vrtReportStats: {
            failedItems: string[];
            passedItems: string[];
            newItems: string[];
            deletedItems: string[];
        } = JSON.parse(fs.readFileSync(vrtCommandReportFile, 'utf8'));

        if (vrtReportStats.failedItems.length > 0) {
            for (const file of vrtReportStats.failedItems) {
                teamcityLogger(
                    `testFailed name='${file}' message='sandbox screenshots are different' details=''`
                );
            }
        }

        if (vrtReportStats.deletedItems.length > 0) {
            for (const file of vrtReportStats.deletedItems) {
                teamcityLogger(
                    `testFailed name='${file}' message='sandbox screenshots are missing' details=''`
                );
            }
        }

        fs.writeFileSync(reportPage, generateReportTemplate(vrtReportStats));
        console.info('Report generated to', reportPage);
        process.exit(0);
    } catch (error) {
        console.error(`Comparing images error: \n${error.stack || error}`);
        process.exit(1);
    }
}
