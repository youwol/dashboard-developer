import { ReplaySubject } from "rxjs"
import { Environment, instanceOfEnvironment } from "../environment/models"
import { createObservableFromFetch } from "./router"

export class EnvironmentRouter{

    private static urlBase = '/admin/environment'
    private static webSocket$ : ReplaySubject<any> 
    public static environments$ = new ReplaySubject<Environment>(1)
    static headers = {}

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
        let request = new Request(url, { method: 'GET', headers: EnvironmentRouter.headers })
        return createObservableFromFetch(request)
    } 

    static fileContent$() {

        let url = `${EnvironmentRouter.urlBase}/file-content`
        let request = new Request(url, { method: 'GET', headers: EnvironmentRouter.headers })
        return createObservableFromFetch(request)
    } 

    static switchConfiguration$(body){

        let url = `${EnvironmentRouter.urlBase}/switch-configuration`
        let request = new Request(url, { method: 'POST', body: JSON.stringify(body), headers: EnvironmentRouter.headers })
        return createObservableFromFetch(request)
    }

    static syncUser$(body){

        let url = `${EnvironmentRouter.urlBase}/sync-user`
        let request = new Request(url, { method: 'POST', body: JSON.stringify(body), headers: EnvironmentRouter.headers })
        return createObservableFromFetch(request)
    }

    static login$(body){

        let url = `${EnvironmentRouter.urlBase}/login`
        let request = new Request(url, { method: 'POST', body: JSON.stringify(body), headers: EnvironmentRouter.headers })
        return createObservableFromFetch(request)
    }

    static selectRemoteGateway$(body:{name:string}){

        let url = `${EnvironmentRouter.urlBase}/select-remote-gateway`
        let request = new Request(url, { method: 'POST', body: JSON.stringify(body), headers: EnvironmentRouter.headers })
        return createObservableFromFetch(request)
    }

    static postConfigParameters$( body){

        let url = `${EnvironmentRouter.urlBase}/configuration/parameters`
        let request = new Request(url, { method: 'POST', body: JSON.stringify(body), headers: EnvironmentRouter.headers })
        return createObservableFromFetch(request)
    }
}