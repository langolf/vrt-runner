import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import log from './log';

type RGBTuple = [number, number, number];

export interface ComparisonOptionsType {
    threshold?: number;
    includeAA?: boolean;
    alpha?: number;
    aaColor?: RGBTuple;
    diffColor?: RGBTuple;
    diffColorAlt?: RGBTuple;
    diffMask?: boolean;
    [x: string]: unknown;
}

export interface DiffResult {
    failed: string[];
    passed: string[];
    new: string[];
    missing: string[];
}

export interface DirsType {
    baselineDir: string;
    testDir: string;
    diffDir: string;
    outputDir: string;
}

const prepareOptions = (options?: ComparisonOptionsType): undefined | ComparisonOptionsType => {
    const optionKeys = options ? Object.keys(options) : [];

    if (optionKeys.length === 0) {
        return undefined;
    }

    if (options) {
        optionKeys.forEach((key) => {
            const propertyName = key as keyof ComparisonOptionsType;

            if (options && options[propertyName] === undefined) {
                delete options[propertyName];
            }
        });
    }

    // default value for threshold
    if (options && options.threshold === undefined) {
        options.threshold = 0.1;
    }

    return options;
};

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

async function diffPair(
    { baseline: baselinePath, test: testPath }: FilePair,
    toDir: string,
    options?: ComparisonOptionsType
): Promise<number> {
    if (!baselinePath || !testPath) {
        console.error(`Baseline or test missing ${baselinePath} ${testPath}`);
        return Promise.reject();
    }

    try {
        const { baseline, test } = getEqualSizedImages(baselinePath, testPath);
        const { width, height } = baseline;
        const diff = new PNG({ width, height });

        const numDiffPixels = pixelmatch(
            baseline.data,
            test.data,
            diff.data,
            width,
            height,
            prepareOptions(options)
        );

        const diffFile = path.join(toDir, path.basename(baselinePath));
        fs.writeFileSync(diffFile, PNG.sync.write(diff));

        return numDiffPixels;
    } catch (error) {
        console.error(`Error diffing file ${baselinePath}: ${error.stack || error.toString()}`);
        return -1;
    }
}

function getEqualSizedImages(baselinePath: string, testPath: string) {
    const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
    const test = PNG.sync.read(fs.readFileSync(testPath));

    // Same sized images, return
    if (baseline.width === test.width && baseline.height === test.height) {
        return { baseline, test };
    }

    // They are different sizes, find the smallest dimension that will fix and crop both
    const finalWidth = Math.min(baseline.width, test.width);
    const finalHeight = Math.min(baseline.height, test.height);

    const newBaseline = new PNG({ width: finalWidth, height: finalHeight });
    const newTest = new PNG({ width: finalWidth, height: finalHeight });

    new PNG(baseline).bitblt(newBaseline, 0, 0, finalWidth, finalHeight, 0, 0);
    new PNG(test).bitblt(newBaseline, 0, 0, finalWidth, finalHeight, 0, 0);

    return {
        baseline: newBaseline,
        test: newTest,
    };
}

type diffDirsType = {
    dirs: DirsType;
    teamcity: boolean;
    options?: ComparisonOptionsType;
};
// For every .png or .jpg file in baseline directory:
// - will try to find file with the same name in test directory
// - if found, will create a diff file in diff directory
// options.baseline {String} - baseline directory
// options.test {String} - test directory
// options.diff {String} - diff directory
const diffDirs = async ({ dirs, teamcity, options }: diffDirsType) => {
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
            const numDiffPixels = await diffPair(pair, dirs.diffDir, options);

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
        if (process.env.NODE_ENV === 'debug') {
            log.warn(`testFinished name='${fileName}'`);
        }
    }

    teamcityMessage(`testSuiteFinished name='VRT'`);

    return result;
};

export default diffDirs;
