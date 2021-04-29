
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

export interface RemoteGateway{
    name: string
    host: string
}

export interface UserConfiguration{

    general: {
        resources: {[key:string]: string},
        remoteGateways: Array<RemoteGateway>
    }
}

export interface RemoteGatewayInfo{
    name: string
    host: string
    connected: boolean | undefined
}

export interface Environment {
    configurationPath: Array<string>,
    configurationParameters: ConfigurationParameters
    userInfo:UserInfo
    users: Array<string>
    configuration: UserConfiguration
    remoteGatewayInfo: RemoteGatewayInfo
    remotesInfo: Array<RemoteGatewayInfo>
}

export function instanceOfEnvironment(object: any): object is Environment{

    return object.configurationPath && object.configurationParameters && object.userInfo && object.users &&
    object.configuration && object.remoteGatewayInfo && object.remotesInfo

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
