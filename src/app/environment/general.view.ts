import { child$, VirtualDOM } from "@youwol/flux-view"
import { BehaviorSubject, Observable, Subscription } from "rxjs"
import { ReplaySubject } from "rxjs/internal/ReplaySubject"
import { filter, map, mergeMap, take } from "rxjs/operators"
import { innerTabClasses } from "../utils-view"
import { Backend } from "../backend"
import { LogsState, LogsView } from "../logs-view"
import { configurationPickerView } from "./configuration-picker.view"
import { userInfoView } from "./user-info.view"
import { configParamsView } from "./config-parameters.view"
import { Environment } from "./models"
import { remoteGatewayInfoView } from "./remote-gateway-info.view"



export class GeneralState {

    static webSocket$: ReplaySubject<any> = Backend.environment.connectWs()

    static environment$ : Observable<Environment> = GeneralState.webSocket$.pipe(
        filter(message => message.type == "Environment")
    )
    static loadingStatus$ = GeneralState.webSocket$.pipe(
        filter(message => message.type == "LoadingStatus")
    )
    static configurationUpdated$ = GeneralState.webSocket$.pipe(
        filter(message => message.type == "ConfigurationUpdated")
    )

    static configurationPaths$ = new BehaviorSubject<Array<string>>(GeneralState.getCachedConfigurationPaths())

    constructor() {
    }
    
    static subscribe(): Subscription{

        return GeneralState.webSocket$.pipe(
            take(1),
            mergeMap(() => Backend.environment.status$())
        ).subscribe((status: any) =>
            GeneralState.cacheConfigurationPath(status.configurationPath)
        )
    }

    static switchConfiguration(path: Array<string>) {

        Backend.environment
            .switchConfiguration$({ path })
            .subscribe()
    }

    static getCachedConfigurationPaths() {
        let cachedData = JSON.parse(
            localStorage.getItem("youwol-local-dashboard") || "{}"
        )
        return cachedData['configurationPaths'] || []
    }


    static cacheConfigurationPath(path: string) {

        let allPaths = GeneralState.getCachedConfigurationPaths()
        if (allPaths.includes(path))
            return
        allPaths = allPaths.filter(p => p != path)
            .concat([path])
        let cache = {
            configurationPaths: allPaths
        }
        localStorage.setItem("youwol-local-dashboard", JSON.stringify(cache))

        GeneralState.configurationPaths$.next(allPaths)
    }
}


export class GeneralView implements VirtualDOM {

    public readonly tag = 'div'
    public readonly children: Array<VirtualDOM>
    public readonly class = innerTabClasses
    public readonly state: GeneralState
    connectedCallback: (elem) => void

    constructor(state: GeneralState) {

        this.state = state
        let logsState = new LogsState(
            GeneralState.webSocket$.pipe(
                map((message) => message)
            )
        )
        
        this.children = [
            {
                class: 'flex-grow-1',
                children: [
                    child$(
                        GeneralState.environment$,
                        (env) => configurationPickerView(env)
                    ),
                    child$(
                        GeneralState.environment$,
                        (env) => configParamsView(env)
                    ),
                    child$(
                        GeneralState.environment$,
                        (env) => userInfoView(env)
                    ),
                    child$(
                        GeneralState.environment$,
                        (env) => remoteGatewayInfoView(env)
                    )
                ]
            },
            new LogsView(logsState)
        ]

        this.connectedCallback = (elem) => {
            elem.subscriptions.push(
                GeneralState.subscribe()
            )
        }
    }
}
