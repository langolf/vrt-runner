import path from 'path';
import generateReport from './report';
import fs from 'fs-extra';
import mkdirp from 'mkdirp';
import execa from 'execa';

export type DirsType = {
    baseline: string;
    test: string;
    diff: string;
};

export type DiffResult = {
    failedItems: string[];
    passedItems: string[];
    newItems: string[];
    deletedItems: string[];
};

export default async function runVrt({ output, cwd }: { output: string; cwd: string }) {
    const reportPage = path.resolve(output, 'index.html');
    const diffReportFile = path.resolve(output, 'diff-report.json');

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
        console.info(`Comparing images...`);
        let cmpTime = Date.now();
        execa.commandSync(
            `reg-cli ${dirs.test} ${dirs.baseline} ${dirs.diff} -A -I -J ${diffReportFile}`,
            {
                stdout: process.stdout,
            }
        );
        cmpTime = Date.now() - cmpTime;
        console.info(`Diff time: ${cmpTime / 1000} s.`);

        const diffResultData: DiffResult = JSON.parse(fs.readFileSync(diffReportFile, 'utf8'));
        generateReport(reportPage, diffResultData);
        console.info('Report generated to', reportPage);
        process.exit(0);
    } catch (error) {
        console.error(`Comparing images error: \n${error.stack || error}`);
        process.exit(1);
    }
}
