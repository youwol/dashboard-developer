import { attr$, VirtualDOM } from "@youwol/flux-view";
import { BehaviorSubject, Observable } from "rxjs";
import { filter, mergeMap } from "rxjs/operators";
import { Backend } from "../backend";
import { button } from "../utils-view";
import { Library, statusClassesDict, StatusEnum } from "./utils";



export function publishView(
    libraries: Array<Library>, 
    releasesStatus$:{ [key:string]: { [key:string]: Observable<StatusEnum> } }, 
    syncQueued$: BehaviorSubject<Set<string>>) : VirtualDOM {
    
    return {
        class:'h-100 w-50 d-flex flex-column fv-bg-background p-3',
        children: [
        {   class: 'd-flex align-items-baseline',
            children:[
                { 
                    tag:'h4' , innerText: 'Tasks', class:'text-center px-2' 
                },
                syncAllBttn(syncQueued$)
            ]
        },
        {   class:"h-100 flex-grow-1 overflow-auto mt-4",
            children:[ 
                syncTable(libraries, releasesStatus$, syncQueued$) 
            ] 
        }
    ]}
}

function syncAllBttn(syncQueued$: BehaviorSubject<Set<string>>) : VirtualDOM  {

    let btn = button('fas fa-sync', 'Sync. all')
    btn.state.click$.subscribe( (d) => {
        let body = { assetIds: Array.from(syncQueued$.getValue()) }
        Backend.uploadPackages.syncPackages$(body).subscribe()
    })
    return btn
}

let classesDict = {
    [StatusEnum.NOT_FOUND]: 'far fa-clock fv-text-background-alt',
    [StatusEnum.SYNC]: 'fas fa-check fv-text-success',
    [StatusEnum.MISMATCH]: 'fas fa-exclamation fv-text-focus',
    [StatusEnum.PROCESSING]: 'fas fa-spinner fa-spin',
}

//'far fa-clock fv-text-background-alt',
export function syncTable( 
    libraries: Array<Library>, 
    releasesStatus$:{ [key:string]: { [key:string]: Observable<StatusEnum> } },
    syncQueued$: BehaviorSubject<Set<string>> ) : VirtualDOM {

    let flattenLibraries = libraries.reduce( (acc, library ) => { 

        let versions = library.releases.map( ({version}) => ({
                assetId: library.assetId,
                libraryName: library.libraryName,
                version: version
            }))
        return acc.concat(versions)
    }, [])

    return {
        tag: 'table', 
        class:'fv-color-primary  w-100 text-center',
        children:[
            {   tag:'thead',
                children:[
                    {   tag: 'tr', class:'fv-bg-background-alt',
                        children: [
                            { tag: 'td', innerText:'Name'},
                            { tag: 'td', innerText:'Version'},
                            { tag: 'td', innerText:'Status'}
                        ] 
                    }
                ]
            },
            {   tag:'tbody',
                children: flattenLibraries.map( ({assetId, libraryName, version}) => {
                    return {
                        tag: 'tr',
                        class: 'fv-pointer fv-hover-bg-background-alt',
                        children: [
                            {   tag: 'td', innerText:libraryName },
                            {   tag: 'td', innerText:version },
                            {   tag: 'td',
                                children:[
                                    {   
                                        class: attr$(
                                            releasesStatus$[assetId][version],
                                            (status) => {
                                                return statusClassesDict[status] 
                                            }
                                        )
                                    }
                                    , {
                                        class: attr$(
                                            releasesStatus$[assetId][version].pipe(
                                                filter( status => status != StatusEnum.SYNC),
                                                mergeMap( () => syncQueued$)
                                            ),
                                            (assetIds: Set<string>) => {
                                                return assetIds.has(assetId) ? 'far fa-clock pl-2' : ''
                                            }
                                        )
                                    }
                                ] 
                            }
                        ]
                    }
                })
            }
        ]
    } 
}

