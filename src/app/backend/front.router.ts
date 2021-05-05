import { Observable, ReplaySubject } from "rxjs";
import { FrontEndStatus } from "../local/utils";
import { createObservableFromFetch } from "./router";

export class FrontsRouter{

    static urlBase = '/admin/frontends'
    private static webSocket$ : ReplaySubject<any> 
    
    static headers = {}

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
        let request = new Request(url, { method: 'GET', headers: FrontsRouter.headers })
        return createObservableFromFetch(request) as Observable<{status: Array<FrontEndStatus>}> 
    } 

    static start$(name:string) {

        let url = `${FrontsRouter.urlBase}/${name}/start`
        let request = new Request(url, { method: 'POST', headers: FrontsRouter.headers })
        return createObservableFromFetch(request)
    } 

    static stop$(name:string) {

        let url = `${FrontsRouter.urlBase}/${name}/stop`
        let request = new Request(url, { method: 'POST', headers: FrontsRouter.headers })
        return createObservableFromFetch(request)
    }    
    
    static skeletons$(){
        let url = `${FrontsRouter.urlBase}/skeletons`
        let request = new Request(url, { method: 'GET', headers: FrontsRouter.headers })
        return createObservableFromFetch(request)
    }

    static createSkeleton$( pipeline_type: string, body){
        let url = `${FrontsRouter.urlBase}/skeletons/${pipeline_type}`
        let request = new Request(url, { method: 'POST',body: JSON.stringify(body), headers: FrontsRouter.headers })
        return createObservableFromFetch(request)
    } 

}
