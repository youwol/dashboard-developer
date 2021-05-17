import { Observable, ReplaySubject } from "rxjs";
import { FrontEndStatus } from "../local/utils";
import { createObservableFromFetch } from "./router";
import { PackageStatus } from "./upload-packages.router";

export interface PackageVersion{
    version: string
    versionNumber: number
}

export interface Package{
    name: string
    versions: Array<PackageVersion>
}

export interface PackagesStatus{
    packages: Array<Package>
}

export interface VersionDetails{
    name: string
    version: string
    versionNumber: number
    filesCount: number
    bundleSize: number
}

export interface PackageDetails{
    name: string
    versions: Array<VersionDetails>
}




export class LocalCdnRouter{

    static urlBase = '/admin/local-cdn'
    private static webSocket$ : ReplaySubject<any> 
    
    static packagesStatus$ = new ReplaySubject<PackagesStatus>(1)
    static packageDetails$ = new ReplaySubject<PackageDetails>(1)

    static headers = {}

    static connectWs(){
        if(LocalCdnRouter.webSocket$)
            return LocalCdnRouter.webSocket$

        LocalCdnRouter.webSocket$ = new ReplaySubject()
        var ws = new WebSocket(`ws://${window.location.host}/admin/local-cdn/ws`);
        ws.onmessage = (event) => {
            let data = JSON.parse(event.data)
            LocalCdnRouter.webSocket$.next(data)

            if(data.target && data.target == 'PackagesStatus') 
                LocalCdnRouter.packagesStatus$.next( data['cdnStatus'] as PackagesStatus)
            
            if(data.target && data.target == 'PackageDetails') 
                LocalCdnRouter.packageDetails$.next( data['packageDetails'] as PackageDetails)

        };
        
        return LocalCdnRouter.webSocket$
    }

    static status$() :  Observable<PackagesStatus> {

        let url = `${LocalCdnRouter.urlBase}/status`
        let request = new Request(url, { method: 'GET', headers: LocalCdnRouter.headers })
        return createObservableFromFetch(request) as Observable<PackagesStatus> 
    } 

    static getPackageDetails$(name: string) {
        let url = `${LocalCdnRouter.urlBase}/packages/${name}`
        let request = new Request(url, { method: 'GET', headers: LocalCdnRouter.headers })
        return createObservableFromFetch(request) as Observable<PackagesStatus> 
    } 

    static deleteVersion$(name, version){
        let url = `${LocalCdnRouter.urlBase}/libraries/${name}/${version}`
        let request = new Request(url, { method: 'DELETE', headers: LocalCdnRouter.headers })
        return createObservableFromFetch(request) as Observable<PackagesStatus> 
    }

    static deletePackage$(name){
        let url = `${LocalCdnRouter.urlBase}/packages/${name}`
        let request = new Request(url, { method: 'DELETE', headers: LocalCdnRouter.headers })
        return createObservableFromFetch(request) as Observable<PackagesStatus> 
    }
}
