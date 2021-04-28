
export enum StatusEnum{

    NOT_FOUND = 'PackageStatus.NOT_FOUND',
    SYNC = 'PackageStatus.SYNC',
    MISMATCH = 'PackageStatus.MISMATCH',
    PROCESSING = 'PackageStatus.PROCESSING',
    DONE = 'PackageStatus.DONE'
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
    cdnStatus: StatusEnum
    treeStatus: StatusEnum
    assetStatus: StatusEnum
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
    'PackageStatus.NOT_FOUND': 'far fa-circle fv-text-disabled',
    'PackageStatus.MISMATCH': 'fas fa-exclamation fv-text-focus',
    'PackageStatus.SYNC': 'fas fa-check fv-text-success',
    'PackageStatus.PROCESSING': 'fas fa-spinner fa-spin',
}
