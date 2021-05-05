import { Subject } from "rxjs";
import { createObservableFromFetch } from "./router";


export class UploadPackagesRouter{

    private static urlBase = '/admin/upload/packages'
    private static webSocket$ : Subject<any> 

    static headers = {}

    static connectWs(){

        if(UploadPackagesRouter.webSocket$)
            return UploadPackagesRouter.webSocket$

            UploadPackagesRouter.webSocket$ = new Subject()
        var ws = new WebSocket(`ws://${window.location.host}${UploadPackagesRouter.urlBase}/ws`);
        ws.onmessage = (event) => {
            UploadPackagesRouter.webSocket$.next(JSON.parse(event.data))
        };
        return UploadPackagesRouter.webSocket$
    }

    static status$() {

        let url = `${UploadPackagesRouter.urlBase}/status`
        let request = new Request(url, { method: 'GET', headers: UploadPackagesRouter.headers })
        return createObservableFromFetch(request)
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