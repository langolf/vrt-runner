import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import { DiffImageOptions, ImageData } from './types';
import { PNG } from 'pngjs';
import pixelmatch, { PixelmatchOptions } from 'pixelmatch';

export function getImageData(img: string) {
    return new Promise<ImageData>((resolve, reject) => {
        try {
            fs.createReadStream(img)
                .pipe(new PNG())
                .on('parsed', function () {
                    resolve({ file: img, ...this });
                })
                .on('error', function (err) {
                    reject(err);
                });
        } catch (err) {
            reject(err);
        }
    });
}

function getExpandedImage(originalImage: ImageData, width: number, height: number) {
    if (originalImage.width == width && originalImage.height == height) {
        return originalImage.data;
    }

    const imageContainer = new Uint8Array(width * height * 4);
    let idx = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            idx = (width * y + x) << 2;
            if (x < originalImage.width) {
                const origIdx = (y * originalImage.width + x) << 2;
                imageContainer[idx] = originalImage.data[origIdx];
                imageContainer[idx + 1] = originalImage.data[origIdx + 1];
                imageContainer[idx + 2] = originalImage.data[origIdx + 2];
                imageContainer[idx + 3] = originalImage.data[origIdx + 3];
            }
        }
    }

    return imageContainer;
}

export function getEqualSizedImages(baseline: ImageData, test: ImageData) {
    if (baseline.width === test.width && baseline.height === test.height) {
        return {
            width: baseline.width,
            height: baseline.height,
            baseline: baseline.data,
            test: test.data,
        };
    }

    const width: number = Math.max(baseline.width, test.width);
    const height: number = Math.max(baseline.height, test.height);

    return {
        width,
        height,
        test: getExpandedImage(test, width, height),
        baseline: getExpandedImage(baseline, width, height),
    };
}

async function compareImages(
    baselineData: ImageData,
    testData: ImageData,
    shouldWriteDiff?: boolean,
    options?: PixelmatchOptions
): Promise<number> {
    const { width, height, baseline, test } = getEqualSizedImages(testData, baselineData);
    const diff = new PNG({ width, height });

    const numDiffPixels = pixelmatch(baseline, test, diff.data, width, height, options);

    if (!shouldWriteDiff) {
        return Promise.resolve(numDiffPixels);
    }

    if (shouldWriteDiff && numDiffPixels === 0) {
        return Promise.resolve(numDiffPixels);
    }

    const diffDir = path.resolve(path.dirname(baselineData.file), '../diff');
    fse.ensureDirSync(diffDir);
    const diffFile = fs.createWriteStream(path.resolve(diffDir, path.basename(baselineData.file)));

    const p = new Promise<number>((resolve, reject) => {
        diffFile.on('finish', () => resolve(numDiffPixels)).on('error', (err) => reject(err));
    });

    diff.pack().pipe(diffFile);

    return p;
}

export async function diffImagePair(opt: DiffImageOptions) {
    const images = await Promise.all([getImageData(opt.baseline), getImageData(opt.test)]);
    return compareImages(images[0], images[1], opt.shouldWriteDiff, opt.options);
}
