import { Observable, ReplaySubject } from "rxjs"
import { Dependencies, Status } from "../local/utils"
import { createObservableFromFetch } from "./router"

export class PackagesRouter{

    private static urlBase = '/admin/packages'
    private static webSocket$ : ReplaySubject<any> 
    
    static headers = {}
    
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
        let request = new Request(url, { method: 'GET', headers: PackagesRouter.headers })
        return createObservableFromFetch(request) as Observable<{status: Array<Status>}>
    } 

    static action$(body) {
        let url = `${PackagesRouter.urlBase}/action`   
        let request = new Request(url, { method: 'POST', body: JSON.stringify(body), headers: PackagesRouter.headers })
        return createObservableFromFetch(request)
    }

    static dependencies$(target: string) : Observable<Dependencies> {
        let url = `${PackagesRouter.urlBase}/${target}/dependencies`   
        let request = new Request(url, { method: 'GET', headers: PackagesRouter.headers })
        return createObservableFromFetch(request) as Observable<Dependencies>
    }    

    static watch$(body){
        let url = `${PackagesRouter.urlBase}/watch`
        let request = new Request(url, { method: 'POST',body: JSON.stringify(body), headers: PackagesRouter.headers })
        return createObservableFromFetch(request)
    }

    static skeletons$(){
        let url = `${PackagesRouter.urlBase}/skeletons`
        let request = new Request(url, { method: 'GET', headers: PackagesRouter.headers })
        return createObservableFromFetch(request)
    }

    static createSkeleton$( pipeline_type: string, body){
        let url = `${PackagesRouter.urlBase}/skeletons/${pipeline_type}`
        let request = new Request(url, { method: 'POST',body: JSON.stringify(body), headers: PackagesRouter.headers })
        return createObservableFromFetch(request)
    }

    static install$( name: string){

        let url = `${PackagesRouter.urlBase}/${name}/install`
        let request = new Request(url, { method: 'POST', headers: PackagesRouter.headers })
        return createObservableFromFetch(request)
    }
}
