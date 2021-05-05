import { attr$, child$, VirtualDOM } from "@youwol/flux-view"
import { combineLatest, merge, Observable, Subject } from "rxjs"
import { delay, filter, map } from "rxjs/operators"
import { Backend } from "../../backend/router"
import { PackagesState } from "./packages-view"

import { Library, LibraryStatus, statusClassesDict, StatusEnum } from "./utils"


export function tableView(
    libraries: Array<Library>, 
    selected$ : Subject<Library>, 
    state: PackagesState
    ): VirtualDOM {

    let librariesStatus$ = state.librariesStatus$

    return {
        class: 'h-100 d-flex flex-column',
        children: [
            {
                class: 'overflow-auto fv-color-primary border',
                children: [
                    {
                        tag: 'table', class: ' w-100 text-center',
                        children: [
                            {
                                tag: 'thead',
                                children: [
                                    {
                                        tag: 'tr', class: 'fv-bg-background-alt',
                                        children: [
                                            { tag: 'td', innerText: 'Name' , class:'px-3'},
                                            { tag: 'td', innerText: 'CDN', class:'px-3'},
                                            { tag: 'td', innerText: 'Asset', class:'px-3'}
                                        ]
                                    }
                                ]
                            },
                            {
                                tag: 'tbody',
                                children: libraries.map( library => {
                                    return {
                                        tag: 'tr',
                                        class: attr$(
                                            combineLatest([state.options$, librariesStatus$[library.assetId]]).pipe(
                                                map( ([{showSynced}, libStatus]) => {
                                                    if(showSynced)
                                                        return true
                                                    return libStatus.status == StatusEnum.SYNC
                                                        ? false
                                                        : true
                                                })
                                            ),
                                            (display) => display ? '' : 'd-none',
                                            { wrapper: (d) => d + ' fv-pointer fv-hover-bg-background-alt'}
                                            ),
                                        children: [
                                            {
                                                tag: 'td', innerText: library.libraryName, class:'px-3'
                                            },
                                            statusCellCDN( library, state  ),
                                            statusCellAsset(library, state)
                                        ],
                                        onclick: () => selected$.next(library)
                                    }
                                })
                            }
                        ]
                    }
                ],
            }

        ]
    }
}

function statusCellCDN( library: Library, state: PackagesState ) {

    let libraryStatus$ = state.librariesStatus$[library.assetId].pipe(map(({cdnStatus}) => cdnStatus))
    let publishStatus$ =  merge(
        ...library.releases.map( r => state.publishStatus$(library.assetId, r.version))
    ).pipe(
        filter( status =>  status == StatusEnum.PROCESSING )
    ) 
    return {
        tag: 'td',
        children:[
            {
                class: attr$(
                    merge(libraryStatus$, publishStatus$) , //packagesStatus$[d.assetId],
                    (status) => statusClassesDict[status],
                    { untilFirst: 'fas fa-spinner fa-spin' }
                )
            }
        ]
    }
}

function statusCellAsset( library: Library, state: PackagesState ) {

    let libraryStatus$ = state.librariesStatus$[library.assetId]
    .pipe( map(({treeStatus}) => treeStatus) )

    return {
        tag: 'td',
        class:' d-flex align-items-center justify-content-around',
        children:[
            {
                class: attr$(
                    libraryStatus$,  //packagesStatus$[d.assetId],
                    (treeStatus) => treeStatus==StatusEnum.SYNC 
                        ? statusClassesDict[StatusEnum.SYNC] 
                        : 'fas fa-times fv-text-error',
                    { untilFirst: 'fas fa-spinner fa-spin' }
                )
            },
            child$(
                libraryStatus$,
                (treeStatus) => {
                    if(treeStatus==StatusEnum.SYNC)
                        return {}
                    return {
                        class: "fas fa-cloud-upload-alt fv-hover-text-focus fv-pointer",
                        onclick: (ev:MouseEvent) => {
                            Backend.uploadPackages.registerAsset(library.assetId).subscribe();
                            ev.stopPropagation()
                        }
                    }
                }
            )
        ]
    }
}