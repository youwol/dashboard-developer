
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

export interface UserConfiguration{

    general: {
        resources: {[key:string]: string},
        remoteGateways: Array<RemoteGateway>
    }
}

export interface Environment {
    configurationPath: Array<string>,
    configurationParameters: ConfigurationParameters
    userInfo:UserInfo
    users: Array<string>
    configuration: UserConfiguration
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
