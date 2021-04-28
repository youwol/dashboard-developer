import { attr$, VirtualDOM } from "@youwol/flux-view"
import { combineLatest, merge, Observable, Subject } from "rxjs"
import { delay, filter, map } from "rxjs/operators"
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
                                            { tag: 'td', innerText: 'Status', class:'px-3'}
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
                                            statusCell( library, state  )
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

function statusCell( library: Library, state: PackagesState ) {

    let libraryStatus$ = state.librariesStatus$[library.assetId].pipe(map(({status}) => status))
    let publishStatus$ =  merge(
        ...library.releases.map( r => state.publishStatus$(library.assetId, r.version))
    ).pipe(
        filter( status =>  status == StatusEnum.PROCESSING )
    ) 
    publishStatus$.subscribe( p => console.log(p))
    return {
        tag: 'td',
        class: attr$(
            merge(libraryStatus$, publishStatus$) , //packagesStatus$[d.assetId],
            (status) => statusClassesDict[status],
            { untilFirst: 'fas fa-spinner fa-spin' }
        )
    }
}