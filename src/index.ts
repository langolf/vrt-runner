import path from 'path';
import diffDirs, { DirsType } from './compare';
import generateReport from './report';
import fs from 'fs-extra';
import mkdirp from 'mkdirp';

export default function runVrt({
    teamcity,
    output,
    cwd,
}: {
    teamcity: boolean;
    output: string;
    cwd: string;
}) {
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
    fs.copySync(path.resolve(cwd, 'baseline'), dirs.baseline);
    fs.copySync(path.resolve(cwd, 'test'), dirs.test);

    // Collect images from baseline and testing paths
    (async () => {
        try {
            // Compare
            console.info(`Comparing images...`);
            let cmpTime = Date.now();
            const result = await diffDirs({ dirs, teamcity });
            cmpTime = Date.now() - cmpTime;

            console.info(
                `==================
Tests failed: ${result.failed.length + result.missing.length}
Tests passed: ${result.passed.length + result.new.length}
Screenshots time: ${/*scrTime / 1000*/ ''} s.
Diff time: ${cmpTime / 1000} s.`
            );

            generateReport(reportFile, result);
            console.info('Report generated to', reportFile);
            process.exit(0);
        } catch (error) {
            console.error(`Comparing images error: \n${error.stack || error}`);
            process.exit(1);
        }
    })();
}
