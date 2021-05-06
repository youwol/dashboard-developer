
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
