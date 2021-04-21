

export enum StatusEnum{

    NOT_FOUND = 'PackageStatus.NOT_FOUND',
    SYNC = 'PackageStatus.SYNC',
    MISMATCH = 'PackageStatus.MISMATCH',
    PROCESSING = 'PackageStatus.PROCESSING',
}

export interface TreeItem{
    name: string
    itemId: string
    group: string
    borrowed: boolean
    rawId: string
}

export interface Releases{

    version: string
    fingerprint: string
}


export interface Library{

    assetId: string
    libraryName: string
    namespace: string
    treeItems: Array<TreeItem>
    releases: Array<Releases>
    rawId: string
}

export interface LibraryStatus{

    assetId: string
    status: StatusEnum
    libraryName: string
    details: { [key:string]: any }
}


export let statusColorsDict = {
    'PackageStatus.NOT_FOUND': 'fv-color-error',
    'PackageStatus.MISMATCH': 'fv-color-focus',
    'PackageStatus.SYNC': 'fv-color-success',
    'PackageStatus.PROCESSING': '',
}

export let statusClassesDict = {
    'PackageStatus.NOT_FOUND': 'fas fa-times fv-text-error',
    'PackageStatus.MISMATCH': 'fas fa-exclamation fv-text-focus',
    'PackageStatus.SYNC': 'fas fa-check fv-text-success',
    'PackageStatus.PROCESSING': 'fas fa-spinner fa-spin',
}

export let statusInfoDict = {
    'PackageStatus.NOT_FOUND': `The package has not been published yet.`,
    'PackageStatus.MISMATCH': `There is a mismatch between the published package and your local versions.
The published package may lack some of your local versions, or one or more version have content mismatch.`,
    'PackageStatus.SYNC': `The published package is synchronized with your local one.`,
    'PackageStatus.PROCESSING': `<i>Please wait: package is synchronizating ...</i>`,
}