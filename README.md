# vrt-runner

VRT runner and result generator for images

`npx @magiclab/vrt-runner --cwd path_to_diff_images --output result_output`

It expects the files to have a simple folder syntax

```
path_to_diff_images
├── baseline
│   ├── 1.png
│   └── 2.png
└── test
    ├── 1.png
    └── 2.png
```

You can also use it as a module

```js
import runVrt from '@magiclab/vrt-runner';

runVrt({
    cwd,
    output,
    teamcity, // boolean flag to know if we should log teamcity friendly output
});
```
