import { Observable, ReplaySubject } from "rxjs";
import { BackEndStatus } from "../local/utils";
import { createObservableFromFetch } from "./router";


export class BacksRouter{

    private static urlBase = '/admin/backends'
    private static webSocket$ : ReplaySubject<any> 
    static headers = {}

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
        let request = new Request(url, { method: 'GET', headers: BacksRouter.headers })
        return createObservableFromFetch(request) as Observable<{status: Array<BackEndStatus>}>
    } 

    static start$(name:string = undefined) {

        let url = name ? `${BacksRouter.urlBase}/${name}/start` : `${BacksRouter.urlBase}/start`
        let request = new Request(url, { method: 'POST', headers: BacksRouter.headers })
        return createObservableFromFetch(request)
    } 

    static restart$() {

        let url = `${BacksRouter.urlBase}/restart`
        let request = new Request(url, { method: 'POST', headers: BacksRouter.headers })
        return createObservableFromFetch(request)
    } 

    static stop$(name:string) {

        let url = `${BacksRouter.urlBase}/${name}/stop`
        let request = new Request(url, { method: 'POST', headers: BacksRouter.headers })
        return createObservableFromFetch(request)
    }   
    
    static skeletons$(){
        let url = `${BacksRouter.urlBase}/skeletons`
        let request = new Request(url, { method: 'GET', headers: BacksRouter.headers })
        return createObservableFromFetch(request)
    }

    static createSkeleton$( pipeline_type: string, body){
        let url = `${BacksRouter.urlBase}/skeletons/${pipeline_type}`
        let request = new Request(url, { method: 'POST',body: JSON.stringify(body), headers: BacksRouter.headers })
        return createObservableFromFetch(request)
    } 

    static install$( name: string){

        let url = `${BacksRouter.urlBase}/${name}/install`
        let request = new Request(url, { method: 'POST', headers: BacksRouter.headers })
        return createObservableFromFetch(request)
    }
}

