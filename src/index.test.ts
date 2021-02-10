import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import { diffImagePair, getEqualSizedImages, getImageData } from './diff-image-pair';

describe('Vrt-runner', () => {
    const testImageFile = path.resolve(__dirname, '../test-images/test/1.png');
    const baselineImageFile = path.resolve(__dirname, '../test-images/baseline/1.png');
    const diffFile = path.resolve(
        __dirname,
        '../test-images/diff',
        path.basename(baselineImageFile)
    );

    beforeAll(() => {
        fse.emptyDirSync(path.resolve(__dirname, '../test-images/diff'));
    });

    test('compare images', async () => {
        const count = await diffImagePair({
            test: testImageFile,
            baseline: baselineImageFile,
        });

        expect(count).toBeGreaterThan(0);
    });

    it('should not create diff file, if there is no specified option', async () => {
        await diffImagePair({
            test: testImageFile,
            baseline: baselineImageFile,
        });

        expect(() => {
            fs.statSync(diffFile);
        }).toThrowError();

        await diffImagePair({
            test: testImageFile,
            baseline: baselineImageFile,
            shouldWriteDiff: true,
        });

        expect(() => {
            fs.statSync(diffFile);
        }).toBeTruthy();
    });

    test('return 0 pixels when compare same images ', async () => {
        const count = await diffImagePair({
            test: path.resolve(__dirname, '../test-images/baseline/no_diff_image.png'),
            baseline: path.resolve(__dirname, '../test-images/test/no_diff_image.png'),
        });

        expect(count).toBe(0);
    });

    test('when images are the same, then diff file should not be created', async () => {
        const diffFile = path.resolve(__dirname, '../test-images/diff/no_diff_image.png');

        await diffImagePair({
            test: path.resolve(__dirname, '../test-images/baseline/no_diff_image.png'),
            baseline: path.resolve(__dirname, '../test-images/test/no_diff_image.png'),
            shouldWriteDiff: true,
        });

        expect(() => {
            fs.statSync(diffFile);
        }).toThrowError();
    });

    test('compare with empty options', async () => {
        const count = await diffImagePair({
            test: testImageFile,
            baseline: baselineImageFile,
            options: {},
        });

        expect(count).toBeGreaterThan(0);
    });

    test('compare with custom options', async () => {
        const count = await diffImagePair({
            test: testImageFile,
            baseline: baselineImageFile,
            options: {
                threshold: 1.0,
            },
        });

        expect(count).toEqual(0);
    });

    describe('Compare images', () => {
        test('With different width', async () => {
            const baselineImage = await getImageData(
                path.resolve(__dirname, '../test-images/baseline/different_width.png')
            );
            const testImageSmallerWidth = await getImageData(
                path.resolve(__dirname, '../test-images/test/different_width.png')
            );

            expect(baselineImage.width).toBeGreaterThan(testImageSmallerWidth.width);

            const { width, height, baseline, test } = getEqualSizedImages(
                baselineImage,
                testImageSmallerWidth
            );

            expect(width).toBe(baselineImage.width);
            expect(test.length).toBe(width * height * 4);
            expect(baselineImage.data).toBe(baseline);

            const diffFile = path.resolve(__dirname, '../test-images/diff/different_width.png');
            fse.removeSync(diffFile);

            await diffImagePair({
                baseline: path.resolve(__dirname, '../test-images/baseline/different_width.png'),
                test: path.resolve(__dirname, '../test-images/test/different_width.png'),
                shouldWriteDiff: true,
            });
        });

        test('with different height', async () => {
            const baselineImage = await getImageData(
                path.resolve(__dirname, '../test-images/baseline/different_height.png')
            );
            const testImageBiggerHeight = await getImageData(
                path.resolve(__dirname, '../test-images/test/different_height.png')
            );

            expect(baselineImage.height).toBeLessThan(testImageBiggerHeight.height);
            const { width, height, baseline, test } = getEqualSizedImages(
                baselineImage,
                testImageBiggerHeight
            );
            expect(height).toBe(testImageBiggerHeight.height);
            expect(baseline.length).toBe(width * height * 4);
            expect(testImageBiggerHeight.data).toBe(test);

            const diffFile = path.resolve(__dirname, '../test-images/diff/different_height.png');
            fse.removeSync(diffFile);

            await diffImagePair({
                baseline: path.resolve(__dirname, '../test-images/baseline/different_height.png'),
                test: path.resolve(__dirname, '../test-images/test/different_height.png'),
                shouldWriteDiff: true,
            });
        });
    });
});
