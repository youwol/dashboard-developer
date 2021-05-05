import { Observable, ReplaySubject } from "rxjs";
import { createObservableFromFetch } from "./router";


export class SystemRouter{

    static urlBase = '/admin/system'
    private static webSocket$ : ReplaySubject<any> 
    static headers = {}

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
        let request = new Request(url, { method: 'POST', body: JSON.stringify(body), headers: SystemRouter.headers })
        return createObservableFromFetch(request) as Observable<{configurations: string[], folders: string[], files: string[]}>
    } 
}


