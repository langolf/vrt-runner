import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

function arrayUnique<T>(array: T[]): T[] {
    const a = array.concat();

    for (let i = 0; i < a.length; ++i) {
        for (let j = i + 1; j < a.length; ++j) {
            if (a[i] === a[j]) a.splice(j--, 1);
        }
    }

    return a;
}

type FilePair = {
    baseline?: string;
    test?: string;
};

function filePairs(dirs: DirsType): FilePair[] {
    const baselineFiles = fs.readdirSync(dirs.baseline);
    const testFiles = fs.readdirSync(dirs.test);
    const uniqueFiles = arrayUnique(baselineFiles.concat(testFiles));

    return uniqueFiles
        .filter((fileName) => {
            const ext = path.extname(fileName);
            return ext === '.png' || ext === '.jpg';
        })
        .map((fileName) => {
            const baseline = path.join(dirs.baseline, fileName);
            const test = path.join(dirs.test, fileName);

            const testTemp = path.join(dirs.test, `Spec${fileName}`);

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

async function diffPair({ baseline, test }: FilePair, toDir: string): Promise<number> {
    if (!baseline || !test) {
        console.error(`Baseline or test missing ${baseline} ${test}`);
        return Promise.reject();
    }

    try {
        const img1 = PNG.sync.read(fs.readFileSync(baseline));
        const img2 = PNG.sync.read(fs.readFileSync(test));
        const { width, height } = img1;
        const diff = new PNG({ width, height });

        const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, {
            threshold: 0.1,
        });

        const diffFile = path.join(toDir, path.basename(baseline));
        fs.writeFileSync(diffFile, PNG.sync.write(diff));

        console.info(`${numDiffPixels} ${baseline}`);

        return numDiffPixels;
    } catch (error) {
        console.error(`Error diffing file ${baseline}: ${error.stack || error.toString()}`);
        throw error;
    }
}

export type DiffResult = {
    failed: string[];
    passed: string[];
    new: string[];
    missing: string[];
};

// For every .png or .jpg file in baseline directory:
// - will try to find file with the same name in test directory
// - if found, will create a diff file in diff directory
// options.baseline {String} - baseline directory
// options.test {String} - test directory
// options.diff {String} - diff directory
async function diffDirs({ dirs, teamcity }: { dirs: DirsType; teamcity: boolean }) {
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

    for (const pair of pairs) {
        const fileName =
            typeof pair.baseline !== 'undefined'
                ? path.relative(dirs.baseline, pair.baseline)
                : path.relative(dirs.test, pair.test!);

        teamcityMessage(`testStarted name='${fileName}'`);

        if (typeof pair.baseline === 'undefined') {
            result.new.push(fileName);
        } else if (typeof pair.test === 'undefined') {
            teamcityMessage(
                `testFailed name='${fileName}' message='sandbox screenshots are missing' details=''`
            );
            result.missing.push(fileName);
        } else {
            const numDiffPixels = await diffPair(pair, dirs.diff);

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

export type DirsType = {
    baseline: string;
    test: string;
    diff: string;
};
