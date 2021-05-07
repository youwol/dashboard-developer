import { Observable } from "rxjs";
import { BacksRouter } from "./backend.router";
import { DownloadPackagesRouter } from "./download-packages.router";
import { EnvironmentRouter } from "./environment.router";
import { FrontsRouter } from "./front.router";
import { PackagesRouter } from "./packages.router";
import { SystemRouter } from "./system.router";
import { UploadPackagesRouter } from "./upload-packages.router";

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

export class Backend {

    static urlBase = '/admin'

    static headers : {[key:string]: string}= {}

    static setHeaders(headers: {[key:string]:string}){
        Backend.headers=headers
        BacksRouter.headers=headers
        SystemRouter.headers=headers
        FrontsRouter.headers=headers
        PackagesRouter.headers=headers
        EnvironmentRouter.headers=headers
        UploadPackagesRouter.headers=headers
        DownloadPackagesRouter.headers=headers
    }
    
    static system = SystemRouter
    static fronts = FrontsRouter 
    static backs = BacksRouter 
    static modules = PackagesRouter 
    static environment = EnvironmentRouter
    static uploadPackages = UploadPackagesRouter
    static downloadPackages = DownloadPackagesRouter
}
