import { BehaviorSubject, combineLatest, merge, ReplaySubject, Subject } from "rxjs";
import { map, mergeMap, scan, take, tap } from "rxjs/operators";
import { EnvironmentRouter } from "./environment.router";
import { createObservableFromFetch } from "./router";
import { TreeItem } from "./shared-models";

export enum StatusEnum{

    NOT_FOUND = 'PackageStatus.NOT_FOUND',
    SYNC = 'PackageStatus.SYNC',
    MISMATCH = 'PackageStatus.MISMATCH',
    PROCESSING = 'PackageStatus.PROCESSING',
    DONE = 'PackageStatus.DONE'
}

export interface Releases{

    version: string
    fingerprint: string
}


export class PackageStatus {
    constructor() {}
}

export class ResolvedPackage extends PackageStatus{

    cdnStatus: StatusEnum
    treeStatus: StatusEnum
    assetStatus: StatusEnum

    constructor({cdnStatus, treeStatus, assetStatus}) {
        super()
        this.cdnStatus = cdnStatus
        this.treeStatus = treeStatus
        this.assetStatus = assetStatus
    }
}
export class ProcessingPackage extends PackageStatus{
}

export class Package{

    assetId: string
    rawId: string
    name: string
    namespace: string
    treeItems : Array<TreeItem>
    releases : Array<Releases>
    status: PackageStatus

    constructor({
        assetId,
        name,
        namespace,
        treeItems,
        releases,
        status
    }){
        this.assetId = assetId
        this.name = name
        this.namespace = namespace
        this.treeItems = treeItems
        this.releases = releases
        this.status = ( typeof(status) == 'string' )
            ? new ProcessingPackage()
            : new ResolvedPackage(status)
            
    }
}

export class PackageVersion{

    assetId: string
    rawId: string
    name: string
    namespace: string
    version: string
    status: StatusEnum

    constructor({
        assetId,
        name,
        namespace,
        version,
        status
    }){
        this.assetId = assetId
        this.name = name
        this.namespace = namespace
        this.version = version
        this.status = status            
    }
}

export class UploadPackagesRouter{

    private static urlBase = '/admin/upload/packages'
    private static webSocket$ : Subject<any> 

    static headers = {}

    static packages$ = new BehaviorSubject<{[key:string]: Package}>({})
    static package$ = new ReplaySubject<Package>(1)

    static packageVersions$ = new BehaviorSubject<{[key:string]: PackageVersion}>({})
    static packageVersion$ = new ReplaySubject<PackageVersion>(1)

    static connectWs(){

        if(UploadPackagesRouter.webSocket$)
            return UploadPackagesRouter.webSocket$

        UploadPackagesRouter.webSocket$ = new Subject()
        var ws = new WebSocket(`ws://${window.location.host}${UploadPackagesRouter.urlBase}/ws`);

        ws.onmessage = (event) => {
            let data = JSON.parse(event.data)

            UploadPackagesRouter.webSocket$.next(data)
            if(data.target && data.target == 'package') 
                UploadPackagesRouter.package$.next(new Package(data))
            
            if(data.target && data.target == 'packageVersion') 
                UploadPackagesRouter.packageVersion$.next(new PackageVersion(data))
            
        };

        this.package$.pipe(
            scan( (acc, e) => {
                if(e==undefined)
                    return {}
                return {...acc, ...{[e.assetId]: e} }
            }, {})
        ).subscribe( (state) => {
            this.packages$.next(state)
        })
        
        this.packageVersion$.pipe(
            scan( (acc, e) => {
                if(e==undefined)
                    return {}
                return {...acc, ...{[`${e.name}#${e.version}`]: e} }
            }, {})
        ).subscribe( (state) => {
            this.packageVersions$.next(state)
        })
        
        return UploadPackagesRouter.webSocket$
    }

    static status$() {
        this.package$.next(undefined)
        this.packageVersion$.next(undefined)
        let url = `${UploadPackagesRouter.urlBase}/status`
        let request = new Request(url, { method: 'GET', headers: UploadPackagesRouter.headers })
        let status$ = combineLatest([
            UploadPackagesRouter.webSocket$.pipe(take(1)),
            createObservableFromFetch(request)
        ]).pipe(
            map( ([_,status])  => status )
        )
        return status$
    } 

    static path$(treeId: string) {

        let url = `${UploadPackagesRouter.urlBase}/${treeId}/path`
        let request = new Request(url, { method: 'GET', headers: UploadPackagesRouter.headers })
        return createObservableFromFetch(request)
    } 

    static remotePath$(treeId: string) {

        let url = `${UploadPackagesRouter.urlBase}/${treeId}/remote-path`
        let request = new Request(url, { method: 'GET', headers: UploadPackagesRouter.headers })
        return createObservableFromFetch(request)
    } 


    static publishLibraryVersion$(libraryName: string, version: string) {

        let url = `${UploadPackagesRouter.urlBase}/publish/${libraryName}/${version}`
        let request = new Request(url, { method: 'POST', headers: UploadPackagesRouter.headers })
        return createObservableFromFetch(request)
    }


    static deleteLibraryVersion$(assetId: string, version: string) {

        let url = `${UploadPackagesRouter.urlBase}/remove/${assetId}/${version}`
        let request = new Request(url, { method: 'DELETE', headers: UploadPackagesRouter.headers })
        return createObservableFromFetch(request) 
    }


    static syncPackage$(libraryName: string) {

        let url = `${UploadPackagesRouter.urlBase}/publish/${libraryName}`
        let request = new Request(url, { method: 'POST', headers: UploadPackagesRouter.headers })
        return createObservableFromFetch(request)
    }

    static syncPackages$( body ) {

        let url = `${UploadPackagesRouter.urlBase}/synchronize`
        let request = new Request(url, { method: 'POST', body:JSON.stringify(body), headers: UploadPackagesRouter.headers })
        return createObservableFromFetch(request)
    }

    static registerAsset( assetId: string) {
        let url = `${UploadPackagesRouter.urlBase}/register-asset/${assetId}`
        let request = new Request(url, { method: 'POST', headers: UploadPackagesRouter.headers })
        return createObservableFromFetch(request)
    }
}