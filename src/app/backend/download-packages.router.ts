import { BehaviorSubject, merge, Observable, ReplaySubject, Subject } from "rxjs";
import { mergeMap, scan, tap } from "rxjs/operators";
import { EnvironmentRouter } from "./environment.router";
import { createObservableFromFetch } from "./router";
import { StatusEnum } from "./upload-packages.router";


export class Group{

    public readonly id: string
    public readonly path: string

    constructor({id, path}: {id: string, path: string}){
        this.id = id
        this.path = path
    }
}

export class Drive{

    public readonly driveId: string
    public readonly name: string

    constructor({driveId, name}: {driveId: string, name: string}){
        this.driveId = driveId
        this.name = name
    }
}

export class DownloadItem{

    name: string
    version: string
    rawId: string
    status: StatusEnum

    constructor( data: {name: string, version: string, status: StatusEnum, rawId: string}){

        Object.assign(this, data)
    }
}

export class DownloadPackagesRouter{

    private static urlBase = '/admin/download/packages'
    private static webSocket$ : Subject<any> 

    public static groups$ = new Subject<Array<Group>>()
    static headers = {}


    static downloadItem$ = new Subject<DownloadItem>()
    static downloadItems$ = new BehaviorSubject<{[key:string]: DownloadItem}>({})

    static connectWs(){

        if(DownloadPackagesRouter.webSocket$)
            return DownloadPackagesRouter.webSocket$

        DownloadPackagesRouter.webSocket$ = new Subject()
        var ws = new WebSocket(`ws://${window.location.host}${DownloadPackagesRouter.urlBase}/ws`);

        EnvironmentRouter.environments$.pipe(
            mergeMap( () => this.status$() )
        ).subscribe()

        ws.onmessage = (event) => {
            let data = JSON.parse(event.data)
            DownloadPackagesRouter.webSocket$.next(data)        

            if(data.target && data.target == 'downloadItem') 
                DownloadPackagesRouter.downloadItem$.next(new DownloadItem(data))    
        };
        this.downloadItem$.pipe(
            scan( (acc, e) => {
                if(e==undefined)
                    return {}
                return {...acc, ...{[`${e.name}#${e.version}`]: e} }
            }, {})
        ).subscribe( (state) => {
            this.downloadItems$.next(state)
        })

        //DownloadPackagesRouter.getGroups$().subscribe( (groups) => this.groups$.next(groups))

        return DownloadPackagesRouter.webSocket$
    }

    static status$() {

        let url = `${DownloadPackagesRouter.urlBase}/status`
        let request = new Request(url, { method: 'GET', headers: DownloadPackagesRouter.headers })
        return createObservableFromFetch(request)
    } 

    static getGroups$() : Observable<Array<Group>>{

        let url = `${DownloadPackagesRouter.urlBase}/groups`
        let request = new Request(url, { method: 'GET', headers: DownloadPackagesRouter.headers })
        return createObservableFromFetch(request) as Observable<Array<Group>>
    } 

    static getDrives$(groupId: string) : Observable<Array<Drive>>{

        let url = `${DownloadPackagesRouter.urlBase}/groups/${groupId}/drives`
        let request = new Request(url, { method: 'GET', headers: DownloadPackagesRouter.headers })
        return createObservableFromFetch(request) as Observable<Array<Drive>>
    } 

    static packageInfo$(assetId: string): Observable<Array<DownloadItem>> {

        let url = `${DownloadPackagesRouter.urlBase}/info/${assetId}`
        let request = new Request(url, { method: 'GET', headers: DownloadPackagesRouter.headers })
        return createObservableFromFetch(request) as Observable<Array<DownloadItem>>
    }

    static download$(body): Observable<Array<DownloadItem>> {

        let url = `${DownloadPackagesRouter.urlBase}/synchronize`
        let request = new Request(url, { method: 'POST', body: JSON.stringify(body), headers: DownloadPackagesRouter.headers })
        return createObservableFromFetch(request) as Observable<Array<DownloadItem>>
    }
}