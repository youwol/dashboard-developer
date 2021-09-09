import { BehaviorSubject, combineLatest, ReplaySubject, Subject } from "rxjs"
import { map, scan, take } from "rxjs/operators"
import { createObservableFromFetch } from "./router"
import { TreeItem } from "./shared-models"


export enum StatusEnum{

    NOT_FOUND = 'DataStatus.NOT_FOUND',
    SYNC = 'DataStatus.SYNC',
    MISMATCH = 'DataStatus.MISMATCH',
    PROCESSING = 'DataStatus.PROCESSING',
    DONE = 'DataStatus.DONE'
}

export class DataStatus {
    constructor() {}
}

export class ResolvedData extends DataStatus{

    dataStatus: StatusEnum
    treeStatus: StatusEnum
    assetStatus: StatusEnum

    constructor({dataStatus, treeStatus, assetStatus}) {
        super()
        this.dataStatus = dataStatus
        this.treeStatus = treeStatus
        this.assetStatus = assetStatus
    }
}
export class ProcessingData extends DataStatus{
}

export class DataAsset{

    assetId: string
    rawId: string
    name: string
    treeItems : Array<TreeItem>
    status: DataStatus
    
    constructor({
        assetId,
        name,
        treeItems,
        status
    }){
        this.assetId = assetId
        this.name = name
        this.treeItems = treeItems
        this.status = ( typeof(status) == 'string' )
            ? new ProcessingData()
            : new ResolvedData(status)
            
    }
}


export class UploadDataRouter{

    private static urlBase = '/admin/upload/data'
    private static webSocket$ : Subject<any> 

    static headers = {}

    static data$ = new BehaviorSubject<{[key:string]: DataAsset}>({})
    static package$ = new ReplaySubject<DataAsset>(1)


    static connectWs(){

        if(UploadDataRouter.webSocket$)
            return UploadDataRouter.webSocket$

            UploadDataRouter.webSocket$ = new Subject()
        var ws = new WebSocket(`ws://${window.location.host}${UploadDataRouter.urlBase}/ws`);

        ws.onmessage = (event) => {
            let data = JSON.parse(event.data)

            UploadDataRouter.webSocket$.next(data)
            if(data.target && data.target == 'data') 
                UploadDataRouter.package$.next(new DataAsset(data))
            
        };

        this.package$.pipe(
            scan( (acc, e) => {
                if(e==undefined)
                    return {}
                return {...acc, ...{[e.assetId]: e} }
            }, {})
        ).subscribe( (state) => {
            this.data$.next(state)
        })
        
        return UploadDataRouter.webSocket$
    }

    static status$() {
        this.package$.next(undefined)
        let url = `${UploadDataRouter.urlBase}/status`
        let request = new Request(url, { method: 'GET', headers: UploadDataRouter.headers })
        let status$ = combineLatest([
            UploadDataRouter.webSocket$.pipe(take(1)),
            createObservableFromFetch(request)
        ]).pipe(
            map( ([_,status])  => status )
        )
        return status$
    } 

    static publish$(assetId: string) {

        let url = `${UploadDataRouter.urlBase}/publish/${assetId}`
        let request = new Request(url, { method: 'POST', headers: UploadDataRouter.headers })
        return createObservableFromFetch(request)
    }
}