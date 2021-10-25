import { BehaviorSubject, combineLatest, ReplaySubject, Subject } from "rxjs"
import { map, scan, take } from "rxjs/operators"
import { createObservableFromFetch } from "./router"
import { TreeItem } from "./shared-models"


export enum StatusEnum {

    NOT_FOUND = 'FluxAppStatus.NOT_FOUND',
    SYNC = 'FluxAppStatus.SYNC',
    MISMATCH = 'FluxAppStatus.MISMATCH',
    PROCESSING = 'FluxAppStatus.PROCESSING',
    DONE = 'FluxAppStatus.DONE'
}

export class FluxAppStatus {
    constructor() { }
}

export class ResolvedFluxApps extends FluxAppStatus {

    fluxStatus: StatusEnum
    treeStatus: StatusEnum
    assetStatus: StatusEnum

    constructor({ fluxStatus, treeStatus, assetStatus }) {
        super()
        this.fluxStatus = fluxStatus
        this.treeStatus = treeStatus
        this.assetStatus = assetStatus
    }
}
export class ProcessingFluxApps extends FluxAppStatus {
}

export class FluxApp {

    assetId: string
    rawId: string
    name: string
    treeItems: Array<TreeItem>
    status: FluxAppStatus

    constructor({
        assetId,
        name,
        treeItems,
        status
    }) {
        this.assetId = assetId
        this.name = name
        this.treeItems = treeItems
        this.status = (typeof (status) == 'string')
            ? new ProcessingFluxApps()
            : new ResolvedFluxApps(status)

    }
}


export class UploadFluxAppsRouter {

    private static urlBase = '/admin/upload/flux-apps'
    private static webSocket$: Subject<any>

    static headers = {}

    static fluxApps$ = new BehaviorSubject<{ [key: string]: FluxApp }>({})
    static package$ = new ReplaySubject<FluxApp>(1)


    static connectWs() {

        if (UploadFluxAppsRouter.webSocket$)
            return UploadFluxAppsRouter.webSocket$

        UploadFluxAppsRouter.webSocket$ = new Subject()
        var ws = new WebSocket(`ws://${window.location.host}${UploadFluxAppsRouter.urlBase}/ws`);

        ws.onmessage = (event) => {
            let data = JSON.parse(event.data)

            UploadFluxAppsRouter.webSocket$.next(data)
            if (data.target && data.target == 'flux-app')
                UploadFluxAppsRouter.package$.next(new FluxApp(data))

        };

        this.package$.pipe(
            scan((acc, e) => {
                if (e == undefined)
                    return {}
                return { ...acc, ...{ [e.assetId]: e } }
            }, {})
        ).subscribe((state) => {
            this.fluxApps$.next(state)
        })

        return UploadFluxAppsRouter.webSocket$
    }

    static status$() {
        this.package$.next(undefined)
        let url = `${UploadFluxAppsRouter.urlBase}/status`
        let request = new Request(url, { method: 'GET', headers: UploadFluxAppsRouter.headers })
        let status$ = combineLatest([
            UploadFluxAppsRouter.webSocket$.pipe(take(1)),
            createObservableFromFetch(request)
        ]).pipe(
            map(([_, status]) => status)
        )
        return status$
    }
    /*
    static path$(treeId: string) {

        let url = `${UploadFluxAppsRouter.urlBase}/${treeId}/path`
        let request = new Request(url, { method: 'GET', headers: UploadFluxAppsRouter.headers })
        return createObservableFromFetch(request)
    } 

    static remotePath$(treeId: string) {

        let url = `${UploadFluxAppsRouter.urlBase}/${treeId}/remote-path`
        let request = new Request(url, { method: 'GET', headers: UploadFluxAppsRouter.headers })
        return createObservableFromFetch(request)
    } 
    */

    static publish$(assetId: string) {

        let url = `${UploadFluxAppsRouter.urlBase}/publish/${assetId}`
        let request = new Request(url, { method: 'POST', headers: UploadFluxAppsRouter.headers })
        return createObservableFromFetch(request)
    }
}
