import { attr$, VirtualDOM } from "@youwol/flux-view"
import { Observable, Subject } from "rxjs"
import { Library, LibraryStatus, statusClassesDict } from "./utils"


export function tableView(
    libraries: Array<Library>, 
    selected$ : Subject<Library>, 
    librariesStatus$:  { [key:string]: Observable<LibraryStatus> }
    ): VirtualDOM {

    return {
        class: 'h-100 w-50 d-flex flex-column fv-bg-background p-3',
        children: [
            { tag: 'h4', innerText: 'Status', class: 'text-center' },
            {
                class: 'flex-grow-1 overflow-auto mt-4',
                children: [
                    {
                        tag: 'table', class: 'fv-color-primary  w-100 text-center',
                        children: [
                            {
                                tag: 'thead',
                                children: [
                                    {
                                        tag: 'tr', class: 'fv-bg-background-alt',
                                        children: [
                                            { tag: 'td', innerText: 'Name' },
                                            { tag: 'td', innerText: 'Status' },
                                            { tag: 'td', innerText: 'Explorer references' },
                                        ]
                                    }
                                ]
                            },
                            {
                                tag: 'tbody',
                                children: libraries.map( d => {
                                    return {
                                        tag: 'tr',
                                        class: 'fv-pointer fv-hover-bg-background-alt',
                                        children: [
                                            {
                                                tag: 'td', innerText: d.libraryName
                                            },
                                            statusCell( librariesStatus$[d.assetId] ),
                                            { 
                                                tag: 'td', 
                                                innerText: d.treeItems.length 
                                            }
                                        ],
                                        onclick: () => selected$.next(d)
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

function statusCell( libraryStatus$ : Observable<LibraryStatus>) {

    return {
        tag: 'td',
        class: attr$(
            libraryStatus$, //packagesStatus$[d.assetId],
            ({status}) => statusClassesDict[status],
            { untilFirst: 'fas fa-spinner fa-spin' }
        )
    }
}