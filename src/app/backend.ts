import { Observable, ReplaySubject, Subject } from "rxjs";
import { Environment, instanceOfEnvironment } from "./environment/models";
import { BackEndStatus, Dependencies, FrontEndStatus, Status } from "./local/utils";

export function createObservableFromFetch( request, extractFct = (d) =>d ){

    return new Observable(observer => {
        fetch(request)
          .then(response => response.json()) // or text() or blob() etc.
          .then(data => {
            observer.next( extractFct(data));
            observer.complete();
          })
          .catch(err => observer.error(err));
    });
}

export class FrontsRouter{

    static urlBase = '/admin/frontends'
    private static webSocket$ : ReplaySubject<any> 
    
    static connectWs(){
        if(FrontsRouter.webSocket$)
            return FrontsRouter.webSocket$

        FrontsRouter.webSocket$ = new ReplaySubject()
        var ws = new WebSocket(`ws://${window.location.host}/admin/frontends/ws`);
        ws.onmessage = (event) => {
            FrontsRouter.webSocket$.next(JSON.parse(event.data))
        };
        return FrontsRouter.webSocket$
    }

    static status$() :  Observable<{status: Array<FrontEndStatus>}> {

        let url = `${FrontsRouter.urlBase}/status`
        let request = new Request(url, { method: 'GET', headers: Backend.headers })
        return createObservableFromFetch(request) as Observable<{status: Array<FrontEndStatus>}> 
    } 

    static start$(name:string) {

        let url = `${FrontsRouter.urlBase}/${name}/start`
        let request = new Request(url, { method: 'POST', headers: Backend.headers })
        return createObservableFromFetch(request)
    } 

    static stop$(name:string) {

        let url = `${FrontsRouter.urlBase}/${name}/stop`
        let request = new Request(url, { method: 'POST', headers: Backend.headers })
        return createObservableFromFetch(request)
    }    
    
    static skeletons$(){
        let url = `${FrontsRouter.urlBase}/skeletons`
        let request = new Request(url, { method: 'GET', headers: Backend.headers })
        return createObservableFromFetch(request)
    }

    static createSkeleton$( pipeline_type: string, body){
        let url = `${FrontsRouter.urlBase}/skeletons/${pipeline_type}`
        let request = new Request(url, { method: 'POST',body: JSON.stringify(body), headers: Backend.headers })
        return createObservableFromFetch(request)
    } 

}


export class SystemRouter{

    static urlBase = '/admin/system'
    private static webSocket$ : ReplaySubject<any> 
    
    static connectWs(){
        if(SystemRouter.webSocket$)
            return SystemRouter.webSocket$

        SystemRouter.webSocket$ = new ReplaySubject()
        var ws = new WebSocket(`ws://${window.location.host}/admin/system/ws`);
        ws.onmessage = (event) => {
            SystemRouter.webSocket$.next(JSON.parse(event.data))
        };
        return SystemRouter.webSocket$
    }

    static folderContent$(path: Array<string>)
     :  Observable<{configurations: string[], folders: string[], files: string[]}>{

        let url = `${SystemRouter.urlBase}/folder-content`
        let body = {path}
        let request = new Request(url, { method: 'POST', body: JSON.stringify(body), headers: Backend.headers })
        return createObservableFromFetch(request) as Observable<{configurations: string[], folders: string[], files: string[]}>
    } 
}


export class BacksRouter{

    private static urlBase = '/admin/backends'
    private static webSocket$ : ReplaySubject<any> 
    
    static connectWs(){

        if(BacksRouter.webSocket$)
            return BacksRouter.webSocket$

            BacksRouter.webSocket$ = new ReplaySubject()
        var ws = new WebSocket(`ws://${window.location.host}${BacksRouter.urlBase}/ws`);
        ws.onmessage = (event) => {
            BacksRouter.webSocket$.next(JSON.parse(event.data))
        };
        return BacksRouter.webSocket$
    }

    static status$() :  Observable<{status: Array<BackEndStatus>}>{

        let url = `${BacksRouter.urlBase}/status`
        let request = new Request(url, { method: 'GET', headers: Backend.headers })
        return createObservableFromFetch(request) as Observable<{status: Array<BackEndStatus>}>
    } 

    static start$(name:string = undefined) {

        let url = name ? `${BacksRouter.urlBase}/${name}/start` : `${BacksRouter.urlBase}/start`
        let request = new Request(url, { method: 'POST', headers: Backend.headers })
        return createObservableFromFetch(request)
    } 

    static restart$() {

        let url = `${BacksRouter.urlBase}/restart`
        let request = new Request(url, { method: 'POST', headers: Backend.headers })
        return createObservableFromFetch(request)
    } 

    static stop$(name:string) {

        let url = `${BacksRouter.urlBase}/${name}/stop`
        let request = new Request(url, { method: 'POST', headers: Backend.headers })
        return createObservableFromFetch(request)
    }   
    
    static skeletons$(){
        let url = `${BacksRouter.urlBase}/skeletons`
        let request = new Request(url, { method: 'GET', headers: Backend.headers })
        return createObservableFromFetch(request)
    }

    static createSkeleton$( pipeline_type: string, body){
        let url = `${BacksRouter.urlBase}/skeletons/${pipeline_type}`
        let request = new Request(url, { method: 'POST',body: JSON.stringify(body), headers: Backend.headers })
        return createObservableFromFetch(request)
    } 

    static install$( name: string){

        let url = `${BacksRouter.urlBase}/${name}/install`
        let request = new Request(url, { method: 'POST', headers: Backend.headers })
        return createObservableFromFetch(request)
    }
}


export class PackagesRouter{

    private static urlBase = '/admin/packages'
    private static webSocket$ : ReplaySubject<any> 
    
    static connectWs(){

        if(PackagesRouter.webSocket$)
            return PackagesRouter.webSocket$

        PackagesRouter.webSocket$ = new ReplaySubject()
        var ws = new WebSocket(`ws://${window.location.host}${PackagesRouter.urlBase}/ws`);
        ws.onmessage = (event) => {
            PackagesRouter.webSocket$.next(JSON.parse(event.data))
        };
        return PackagesRouter.webSocket$
    }

    
    static status$() : Observable<{status: Array<Status>}> {

        let url = `${PackagesRouter.urlBase}/status`
        let request = new Request(url, { method: 'GET', headers: Backend.headers })
        return createObservableFromFetch(request) as Observable<{status: Array<Status>}>
    } 

    static action$(body) {
        let url = `${PackagesRouter.urlBase}/action`   
        let request = new Request(url, { method: 'POST', body: JSON.stringify(body), headers: Backend.headers })
        return createObservableFromFetch(request)
    }

    static dependencies$(target: string) : Observable<Dependencies> {
        let url = `${PackagesRouter.urlBase}/${target}/dependencies`   
        let request = new Request(url, { method: 'GET', headers: Backend.headers })
        return createObservableFromFetch(request) as Observable<Dependencies>
    }    

    static watch$(body){
        let url = `${PackagesRouter.urlBase}/watch`
        let request = new Request(url, { method: 'POST',body: JSON.stringify(body), headers: Backend.headers })
        return createObservableFromFetch(request)
    }

    static skeletons$(){
        let url = `${PackagesRouter.urlBase}/skeletons`
        let request = new Request(url, { method: 'GET', headers: Backend.headers })
        return createObservableFromFetch(request)
    }

    static createSkeleton$( pipeline_type: string, body){
        let url = `${PackagesRouter.urlBase}/skeletons/${pipeline_type}`
        let request = new Request(url, { method: 'POST',body: JSON.stringify(body), headers: Backend.headers })
        return createObservableFromFetch(request)
    }

    static install$( name: string){

        let url = `${PackagesRouter.urlBase}/${name}/install`
        let request = new Request(url, { method: 'POST', headers: Backend.headers })
        return createObservableFromFetch(request)
    }
}


export class EnvironmentRouter{

    private static urlBase = '/admin/environment'
    private static webSocket$ : ReplaySubject<any> 
    public static environments$ = new ReplaySubject<Environment>(1)

    static connectWs(){

        if(EnvironmentRouter.webSocket$)
            return EnvironmentRouter.webSocket$

        EnvironmentRouter.webSocket$ = new ReplaySubject()
        var ws = new WebSocket(`ws://${window.location.host}${EnvironmentRouter.urlBase}/ws`);
        ws.onmessage = (event) => {
            let d = JSON.parse(event.data)
            EnvironmentRouter.webSocket$.next(d)
            if(instanceOfEnvironment(d))
                EnvironmentRouter.environments$.next(d) 
        };

        return EnvironmentRouter.webSocket$
    }


    static status$() {

        let url = `${EnvironmentRouter.urlBase}/status`
        let request = new Request(url, { method: 'GET', headers: Backend.headers })
        return createObservableFromFetch(request)
    } 

    static fileContent$() {

        let url = `${EnvironmentRouter.urlBase}/file-content`
        let request = new Request(url, { method: 'GET', headers: Backend.headers })
        return createObservableFromFetch(request)
    } 

    static switchConfiguration$(body){

        let url = `${EnvironmentRouter.urlBase}/switch-configuration`
        let request = new Request(url, { method: 'POST', body: JSON.stringify(body), headers: Backend.headers })
        return createObservableFromFetch(request)
    }

    static syncUser$(body){

        let url = `${EnvironmentRouter.urlBase}/sync-user`
        let request = new Request(url, { method: 'POST', body: JSON.stringify(body), headers: Backend.headers })
        return createObservableFromFetch(request)
    }

    static login$(body){

        let url = `${EnvironmentRouter.urlBase}/login`
        let request = new Request(url, { method: 'POST', body: JSON.stringify(body), headers: Backend.headers })
        return createObservableFromFetch(request)
    }

    static selectRemoteGateway$(body:{name:string}){

        let url = `${EnvironmentRouter.urlBase}/select-remote-gateway`
        let request = new Request(url, { method: 'POST', body: JSON.stringify(body), headers: Backend.headers })
        return createObservableFromFetch(request)
    }

    static postConfigParameters$( body){

        let url = `${EnvironmentRouter.urlBase}/configuration/parameters`
        let request = new Request(url, { method: 'POST', body: JSON.stringify(body), headers: Backend.headers })
        return createObservableFromFetch(request)
    }
}

export class UploadPackagesRouter{

    private static urlBase = '/admin/upload/packages'
    private static webSocket$ : Subject<any> 

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
        let request = new Request(url, { method: 'GET', headers: Backend.headers })
        return createObservableFromFetch(request)
    } 

    static path$(treeId: string) {

        let url = `${UploadPackagesRouter.urlBase}/${treeId}/path`
        let request = new Request(url, { method: 'GET', headers: Backend.headers })
        return createObservableFromFetch(request)
    } 

    static remotePath$(treeId: string) {

        let url = `${UploadPackagesRouter.urlBase}/${treeId}/remote-path`
        let request = new Request(url, { method: 'GET', headers: Backend.headers })
        return createObservableFromFetch(request)
    } 


    static publishLibraryVersion$(libraryName: string, version: string) {

        let url = `${UploadPackagesRouter.urlBase}/publish/${libraryName}/${version}`
        let request = new Request(url, { method: 'POST', headers: Backend.headers })
        return createObservableFromFetch(request)
    }

    static syncPackage$(libraryName: string) {

        let url = `${UploadPackagesRouter.urlBase}/publish/${libraryName}`
        let request = new Request(url, { method: 'POST', headers: Backend.headers })
        return createObservableFromFetch(request)
    }

    static syncPackages$( body ) {

        let url = `${UploadPackagesRouter.urlBase}/synchronize`
        let request = new Request(url, { method: 'POST', body:JSON.stringify(body), headers: Backend.headers })
        return createObservableFromFetch(request)
    }

    static registerAsset( assetId: string) {
        let url = `${UploadPackagesRouter.urlBase}/register-asset/${assetId}`
        let request = new Request(url, { method: 'POST', headers: Backend.headers })
        return createObservableFromFetch(request)
    }
}
/*
export class AssetsRouter{

    private static urlBase = '/admin/assets'
    private static webSocket$ : ReplaySubject<any> 
    
    static connectWs(){

        if(AssetsRouter.webSocket$)
            return AssetsRouter.webSocket$

        AssetsRouter.webSocket$ = new ReplaySubject()
        var ws = new WebSocket(`ws://${window.location.host}${AssetsRouter.urlBase}/ws`);
        ws.onmessage = (event) => {
            AssetsRouter.webSocket$.next(JSON.parse(event.data))
        };  
        return AssetsRouter.webSocket$
    }

    static packages = AssetsPackageRouter
}
*/
export class Backend {

    static urlBase = '/admin'

    static headers : {[key:string]: string}= {}

    static setHeaders(headers: {[key:string]:string}){
        Backend.headers=headers
    }
    
    static system = SystemRouter
    static fronts = FrontsRouter 
    static backs = BacksRouter 
    static modules = PackagesRouter 
    static environment = EnvironmentRouter
    static uploadPackages = UploadPackagesRouter
}
