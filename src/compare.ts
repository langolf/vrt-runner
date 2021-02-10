import fs from 'fs';
import path from 'path';
import { DirsType, DiffDirsType, FilePair, DiffResult } from './types';
import { diffImagePair } from './diff-image-pair';

function arrayUnique<T>(array: T[]): T[] {
    const a = array.concat();

    for (let i = 0; i < a.length; ++i) {
        for (let j = i + 1; j < a.length; ++j) {
            if (a[i] === a[j]) a.splice(j--, 1);
        }
    }

    return a;
}

function filePairs(dirs: DirsType): FilePair[] {
    const baselineFiles = fs.readdirSync(dirs.baselineDir);
    const testFiles = fs.readdirSync(dirs.testDir);
    const uniqueFiles = arrayUnique(baselineFiles.concat(testFiles));

    return uniqueFiles
        .filter((fileName) => {
            const ext = path.extname(fileName);
            return ext === '.png' || ext === '.jpg';
        })
        .map((fileName) => {
            const baseline = path.join(dirs.baselineDir, fileName);
            const test = path.join(dirs.testDir, fileName);

            const testTemp = path.join(dirs.testDir, `Spec${fileName}`);

            if (fs.existsSync(testTemp) && !fs.existsSync(test)) {
                fs.copyFileSync(testTemp, test);
            }

            const baselineExists = fs.existsSync(baseline);
            const testExists = fs.existsSync(test);

            return {
                baseline: baselineExists ? baseline : undefined,
                test: testExists ? test : undefined,
            };
        })
        .filter(Boolean);
}

// For every .png or .jpg file in baseline directory:
// - will try to find file with the same name in test directory
// - if found, will create a diff file in diff directory
// options.baseline {String} - baseline directory
// options.test {String} - test directory
// options.diff {String} - diff directory
export async function diffDirs({ dirs, teamcity, options }: DiffDirsType) {
    const pairs = filePairs(dirs);

    const result: DiffResult = {
        failed: [],
        passed: [],
        new: [],
        missing: [],
    };

    function teamcityMessage(message: string) {
        if (teamcity) {
            console.info(`##teamcity[${message}]`);
        }
    }

    teamcityMessage(`testSuiteStarted name='VRT'`);

    for await (const pair of pairs) {
        const fileName =
            typeof pair.baseline !== 'undefined'
                ? path.relative(dirs.baselineDir, pair.baseline)
                : path.relative(dirs.testDir, pair.test!);

        teamcityMessage(`testStarted name='${fileName}'`);

        if (typeof pair.baseline === 'undefined') {
            result.new.push(fileName);
        } else if (typeof pair.test === 'undefined') {
            teamcityMessage(
                `testFailed name='${fileName}' message='sandbox screenshots are missing' details=''`
            );
            result.missing.push(fileName);
        } else {
            const numDiffPixels = await diffImagePair({
                baseline: pair.baseline,
                test: pair.test,
                shouldWriteDiff: true,
                options,
            });
            if (numDiffPixels > 0) {
                teamcityMessage(
                    `testFailed name='${fileName}' message='sandbox screenshots are different' details=''`
                );
                result.failed.push(fileName);
            } else {
                result.passed.push(fileName);
            }
        }

        teamcityMessage(`testFinished name='${fileName}'`);
    }

    teamcityMessage(`testSuiteFinished name='VRT'`);

    return result;
}

export default diffDirs;
