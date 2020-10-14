import path from 'path';
import generateReportTemplate from './report';
import fs from 'fs-extra';
import mkdirp from 'mkdirp';
import execa from 'execa';

export default async function runVrt({
    output,
    cwd,
    options,
}: {
    output: string;
    cwd: string;
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

        fs.writeFileSync(
            reportPage,
            generateReportTemplate(JSON.parse(fs.readFileSync(vrtCommandReportFile, 'utf8')))
        );

        console.info('Report generated to', reportPage);
        process.exit(0);
    } catch (error) {
        console.error(`Comparing images error: \n${error.stack || error}`);
        process.exit(1);
    }
}
