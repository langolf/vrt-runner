# [@magiclab/vrt-runner](https://www.npmjs.com/package/@magiclab/vrt-runner)

VRT runner and result generator for images

![VRT Example](https://raw.githubusercontent.com/badoo/vrt-runner/master/example.png "VRT Example")

## CLI

`npx @magiclab/vrt-runner --cwd path_to_diff_images --output result_output`

It expects the files to have a simple folder syntax

```bash
path_to_diff_images
├── baseline
│   ├── 1.png
│   └── 2.png
└── test
    ├── 1.png
    └── 2.png
```

## How to measure screenShot time

One of the ways to provide this data is the following:

### Share screenShot time in Node

```js

(async function() {
    try {
        let scrTime = Date.now();

        // ... this is your screenshot taking script implementation ...

        scrTime = Date.now() - scrTime;

        runVrt({
            cwd,
            output,
            teamcity, // boolean flag to know if we should log teamcity friendly output
            scrTime, // screenshot taking time in miliseconds
            threshold // Matching threshold, ranges from 0 to 1. Smaller values make the comparison more sensitive.
        });
    }
    process.exit(0);
})();
```

### Share screenShot time via CLI

```bash
    npx @magiclab/vrt-runner --cwd path_to_diff_images --output result_output --scrTime=10
```

## How to change matching threshold for image comparison

Default values is 0.1

You might want to change the different comparison diff levels for different instances `vrt-runner`:

### Change comparison diff threshold in Node

```js
    const threshold = 0.2;

    const vrtIntance01 = runVrt({
        cwd,
        output,
        teamcity, // boolean flag to know if we should log teamcity friendly output
        scrTime, // screenshot taking time in miliseconds
        threshold // Matching threshold, ranges from 0 to 1. Smaller values make the comparison more sensitive.
    });

    const anotherThreshold = 0.25;

    const vrtIntance03 = runVrt({
        cwd,
        output,
        teamcity, // boolean flag to know if we should log teamcity friendly output
        scrTime, // screenshot taking time in miliseconds
        anotherThreshold // Matching threshold, ranges from 0 to 1. Smaller values make the comparison more sensitive.
    });

    const vrtIntance03 = runVrt({
        cwd,
        output,
        teamcity, // boolean flag to know if we should log teamcity friendly output
        scrTime, // screenshot taking time in miliseconds
    });
})();
```

### Change comparison diff threshold via CLI

```bash
    npx @magiclab/vrt-runner --cwd path_to_diff_images --output result_output --threshold=0.25
```

## Node

You can also use it as a node module

```js
import runVrt from '@magiclab/vrt-runner';

runVrt({
    cwd,
    output,
    teamcity, // boolean flag to know if we should log teamcity friendly output
    scrTime, // optional: screenshot taking time in miliseconds
    threshold // optional: Matching threshold, ranges from 0 to 1. Smaller values make the comparison more sensitive.
});
```

## Assets

CSS files for the report page are generated. If you need to make changes to it, update `src/report-assets/css/vrt.scss` and run the following command:

```bash
    yarn styles
```
