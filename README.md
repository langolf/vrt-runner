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

### Change options via CLI, e.g. comparison diff threshold

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
    options, // optional: parameters for pixelmatch
});
```

## Hooks

Currently we support `onVrtComplete` hook, which allows you to get results of comparison and timing of comparison.

One of the ways to use this data is the following:

```js

(async function() {
    try {
        // define action
        const onVrtCompleteAction: onVrtCompleteType = (result, cmpTime) => {
            const info = showResults({
                failed: result.failed.length + result.missing.length,
                passed: result.passed.length + result.new.length,
                diffTime: cmpTime / 1000,
            });

            return info;
        };

        // save data after runVrt
        const info = await runVrt({
            cwd,
            output,
            teamcity, // boolean flag to know if we should log teamcity friendly output
            onVrtComplete: onVrtCompleteAction
        });

        // work with data
        console.log(info);
    }
    process.exit(0);
})();
```

## How to change optons for `pixelmatch` instance

You might want to change the different comparison options in instances of `vrt-runner`. You can do it via `options`, which are are aligned with [pixelmatch API](https://github.com/mapbox/pixelmatch)

### Change comparison diff threshold in Node

```js
    const options = {
        threshold:0.2
    };

    const vrtIntance01 = runVrt({
        cwd,
        output,
        teamcity, // boolean flag to know if we should log teamcity friendly output
        options,
    });

    const optionsSecondType = {
        threshold:0.2
    };

    const vrtIntance03 = runVrt({
        cwd,
        output,
        teamcity, // boolean flag to know if we should log teamcity friendly output
        optionsSecondType,
    });

    const vrtIntance03 = runVrt({
        cwd,
        output,
        teamcity, // boolean flag to know if we should log teamcity friendly output
    });
})();
```


## Assets

CSS files for the report page are generated. If you need to make changes to it, update `src/report-assets/css/vrt.scss` and run the following command:

```bash
    yarn styles
```
