/* eslint-env browser */

if (/complete|loaded|interactive/.test(document.readyState) && document.body) {
    start();
} else {
    document.addEventListener('DOMContentLoaded', start, false);
}

function refreshVisualisation(action, trigger) {
    const container = trigger.testContainer;
    const layer = container.querySelector('.current');
    let mode, range, value, perc;

    if (action === 'toggle') {
        mode = trigger.getAttribute('data-visualisation');
        range = container.querySelector('.js-control-range');
        value = range.value;

        container.classList.toggle('multilayer', mode !== 'side-by-side');
        container.mode = mode;
    } else if (action === 'range') {
        mode = container.mode;
        range = trigger;
        value = trigger.value;
    }

    if (mode === 'fade') {
        layer.setAttribute('style', `opacity: ${value}`);
    } else if (mode === 'swipe') {
        perc = (value * 100).toFixed(2);
        layer.setAttribute(
            'style',
            `-webkit-clip-path: inset(0 0 0 ${perc}%); clip-path: inset(0 0 0 ${perc}%);`
        );
    } else {
        // reset all the properties
        range.value = 0.5;
        layer.setAttribute('style', '');
    }
}

function start() {
    const toggleCollapsed = document.querySelectorAll('.js-toggle-collapsed');
    const toggleVisualisation = document.querySelectorAll('.js-toggle-visualisation');
    const controlRange = document.querySelectorAll('.js-control-range');
    const blockScreenshot = document.querySelectorAll('.screenshot');
    let i;
    let toggle;
    let j;
    let k;

    for (i = 0; i < toggleCollapsed.length; i++) {
        toggle = toggleCollapsed[i];
        toggle.addEventListener('change', function () {
            const container = this.parentNode.parentNode.parentNode;
            const tests = container.querySelectorAll('.vrt-test');
            const images = container.querySelectorAll('img');

            for (j = 0; j < tests.length; j++) {
                const test = tests[j];
                test.classList.toggle('collapsed', !this.checked);
            }

            for (k = 0; k < images.length; k++) {
                const image = images[k];
                if (this.checked) {
                    image.src = image.getAttribute('data-src');
                } else {
                    image.setAttribute('data-src', image.src);
                    image.src = '';
                }
            }
        });
    }

    for (i = 0; i < toggleVisualisation.length; i++) {
        toggle = toggleVisualisation[i];
        toggle.testContainer = toggle.parentNode.parentNode.parentNode;
        toggle.addEventListener('click', function () {
            refreshVisualisation('toggle', this);
        });
    }

    for (i = 0; i < blockScreenshot.length; i++) {
        const block = blockScreenshot[i];
        block.testContainer = block.parentNode.parentNode;
        block.addEventListener('click', function (e) {
            if (this.testContainer.mode === 'fade' || this.testContainer.mode === 'swipe') {
                e.preventDefault();
            }
        });
    }

    for (i = 0; i < controlRange.length; i++) {
        const control = controlRange[i];
        control.testContainer = control.parentNode.parentNode.parentNode;
        control.addEventListener('input', function () {
            refreshVisualisation('range', this);
        });
    }
}
