import { PixelmatchOptions } from 'pixelmatch';

export interface DiffImageOptions {
    baseline: string;
    test: string;
    shouldWriteDiff?: boolean;
    options?: PixelmatchOptions;
}

export interface DiffResult {
    failed: string[];
    passed: string[];
    new: string[];
    missing: string[];
}

export type DiffDirsType = {
    dirs: DirsType;
    teamcity: boolean;
    options?: PixelmatchOptions;
};

export interface DirsType {
    baselineDir: string;
    testDir: string;
    diffDir: string;
    outputDir: string;
}

export type FilePair = {
    baseline?: string;
    test?: string;
};

export interface ImageData {
    file: string;
    width: number;
    height: number;
    data: Uint8Array;
}
