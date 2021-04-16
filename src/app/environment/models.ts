
export interface UserInfo{
    email: string
    name: string
    memberOf: Array<string>
}

export interface FormalParameter{
    name: string
    description: string
    value: any
    meta: any
}

export interface ConfigurationParameters{
    parameters: {[key:string]: FormalParameter}
}

export interface Environment {
    configurationPath: string,
    configurationParameters: ConfigurationParameters
    userInfo:UserInfo
    users: Array<string>
}


export interface ConfigurationError {
    reason: string
    hints: Array<string>
}

export interface Check {
    name: string
    status: boolean | undefined | ConfigurationError
}

export interface LoadingStatus {
    validated: boolean
    path: string
    checks: Array<Check>
}
