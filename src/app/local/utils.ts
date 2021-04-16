


export interface Status{
    assetId: string
    name: string
    documentation: string | undefined
    version: string
    category: string
    installStatus: string
    buildStatus: string
    testStatus: string
    cdnStatus: string
}


export interface Dependencies{
    aboveDependencies: Array<string>
    belowDependencies: Array<string>
}

export enum Action{
    INSTALL = 'INSTALL',
    BUILD = 'BUILD',
    TEST = 'TEST',
    CDN = 'CDN',
    SYNC = 'SYNC',
    SERVE = 'SERVE',
}

export enum ActionScope{
    TARGET_ONLY = "TARGET_ONLY",
    ALL_ABOVE = "ALL_ABOVE",
    ALL_BELOW = "ALL_BELOW",
    ALL = "ALL"
}
export enum LogLevel {

    DEBUG = "DEBUG",
    INFO = "INFO",
    WARNING = "WARNING",
    ERROR = "ERROR"
}

export enum ActionStep{

    STARTED = "STARTED",
    PREPARATION = "PREPARATION",
    STATUS = "STATUS",
    RUNNING = "RUNNING",
    PACKAGING = "PACKAGING",
    DONE = "DONE"
}

export enum  InstallStatus{

    INSTALLED = "INSTALLED",
    NOT_INSTALLED = "NOT_INSTALLED"
}

export enum  BuildStatus{

    SYNC = "SYNC",
    RED = "RED",
    NEVER_BUILT = "NEVER_BUILT",
    OUT_OF_DATE = "OUT_OF_DATE",
    INDIRECT_OUT_OF_DATE = "INDIRECT_OUT_OF_DATE"
}

export enum  TestStatus{

    GREEN = "GREEN",
    OUT_OF_DATE = "OUT_OF_DATE",
    INDIRECT_OUT_OF_DATE = "OUT_OF_DATE",
    RED = "RED",
    NO_ENTRY = "NO_ENTRY",
}

export enum  CdnStatus{

    SYNC = "SYNC",
    NOT_PUBLISHED = "NOT_PUBLISHED",
    OUT_OF_DATE = "OUT_OF_DATE",
    CDN_ERROR = "CDN_ERROR",
}

export interface BackEndStatus{

    name: string
    assetId: string
    openApi: string
    url: string
    devServer: boolean
    health: boolean
    deployed: boolean
    installStatus: InstallStatus
}



export interface FrontEndStatus{

    name: string
    url: string
    devServer: boolean | null
    health: boolean
    deployed: boolean
    
}