export {}
require('./style.css');

let cdn = window['@youwol/cdn-client']
await cdn.fetchStyleSheets([
    "bootstrap#4.4.1~bootstrap.min.css",
    "fontawesome#5.12.1~css/all.min.css",
    "@youwol/fv-widgets#0.0.3~dist/assets/styles/style.youwol.css",
    "codemirror#5.52.0~codemirror.min.css",
    "codemirror#5.52.0~theme/blackboard.min.css",
])

await cdn.fetchBundles(
    { 
        d3:'5.15.0',
        lodash:'4.17.15',
        '@youwol/flux-view':'latest',
        "@youwol/fv-group":"latest",
        "@youwol/fv-input":"latest",
        "@youwol/fv-button":"latest",
        "@youwol/fv-tree":"latest",
        "@youwol/fv-tabs":"latest",
        "@youwol/flux-youwol-essentials":"latest",
        "@youwol/flux-files":"latest",
        rxjs: '6.5.5',
    }, 
    window
)
await cdn.fetchJavascriptAddOn([
    "codemirror#5.52.0~codemirror.min.js",
])
await cdn.fetchJavascriptAddOn([
    "codemirror#5.52.0~mode/python.min.js"
])
await import('./on-load')