import { attr$, child$, VirtualDOM } from "@youwol/flux-view";
import { Observable } from "rxjs";
import { button } from "../../utils-view";
import { Backend } from "../../backend";
import { Library, LibraryStatus, statusClassesDict, statusColorsDict, StatusEnum, statusInfoDict } from "./utils";
import { LogsView } from "../../logs-view";
import { PackagesState } from "./packages-view";



export function detailsView( 
    library: Library,  
    packagesState : PackagesState
    ) : VirtualDOM {
    
    let libraryStatus$ = packagesState.librariesStatus$[library.assetId]
    
    return { 
        class: "h-100 d-flex flex-column w-100 fv-bg-background",
        children:[
            {
                class: attr$(
                    libraryStatus$,
                    ({status}) => statusColorsDict[status],
                    {   untilFirst: 'h-75 d-flex flex-column fv-bg-background p-3 overflow-auto',
                        wrapper: (d) => d +  ' h-100 d-flex flex-column fv-bg-background p-3  overflow-auto'
                    }
                ),
                style:{'border-width':'3px'},
                children:[
                    title(library),
                    statusInfo(libraryStatus$), 
                    { innerText: attr$( 
                        libraryStatus$,
                        (s:LibraryStatus) => "assetStatus:" + s.assetStatus) 
                    },
                    { innerText: attr$( 
                        libraryStatus$,
                        (s:LibraryStatus) => "treeStatus:" + s.treeStatus) 
                    },
                    {
                        class:'d-flex h-100',
                        children:[
                            explorerStatus(library),
                            versionsStatus(library, packagesState)
                        ]
                    }
                ]  
            },
            new LogsView(packagesState.logsState)
        ]
    }
}

function title(library: Library) : VirtualDOM {

    return {   
        class: 'd-flex justify-content-center align-items-center ',
        children:[
            {   tag:'h3', 
                class:'text-center my-2',
                innerText: library.libraryName
            },
            syncBttn(library.assetId)
        ]
    }
}


function statusInfo( libraryStatus$ : Observable<LibraryStatus>) : VirtualDOM {
    return {   
        class:'my-4 d-flex mx-auto align-items-center  fv-bg-background-alt rounded p-3',
        style: {'max-width': '50%'},
        children:[
            {   tag:'i', 
                class:attr$(
                    libraryStatus$,
                    ({status}) => statusClassesDict[status],
                    { untilFirst:  statusClassesDict['PackageStatus.PROCESSING'],
                        wrapper: (d) => d + " fa-2x"}
                )
            },
            {   class:'text-center pl-4', style:{'font-size': 'large'},
                innerHTML: attr$(
                    libraryStatus$,
                    ({status}) => statusInfoDict[status],
                    { untilFirst:  statusInfoDict['PackageStatus.PROCESSING'] }
                )}
        ]
    }
}


function explorerStatus(library: Library) : VirtualDOM {

    return {
        class:'my-2 h-100 w-50',
        children: [
            { 
                tag:'h5' , innerText: 'Local explorer references' 
            },
            { 
                children: library.treeItems.map( item => ({                    
                    children:[
                        child$(
                            Backend.uploadPackages.path$(item.itemId),
                            (pathResponse) => explorerCard(pathResponse)
                        )
                    ]
                }))
            }
        ]
    }
}

function explorerCard( {group, drive, folders} ) : VirtualDOM {

    return {
        class: 'border rounded fv-color-primary p-4',
        style: {width:'fit-content'},
        children:[
            {   class: 'd-flex align-items-center',
                children:[
                    {   
                        tag:'i',
                        class:'fas fa-users px-2'
                    },
                    {
                        innerText: group
                    }
                ]
            },
            {   class: 'd-flex align-items-center',
                children:[
                    {   
                        tag:'i',
                        class:'fas fa-hdd px-2'
                    },
                    {
                        innerText: drive.name
                    }
                ]
            },
            {   class:'px-2',
                innerText: folders.reduce( (acc,e) => acc+' / '+e.name,"")                                            
            }
        ]
    }
}


function versionsStatus( library: Library, packagesState: PackagesState ) : VirtualDOM{

    return {   
        class:'h-100 w-50 d-flex flex-column', style:{height:'0px'},
        children: [
            {   tag:'h5' , innerText: 'Versions' },
            {   class:"flex-grow-1 overflow-auto",
                children:[ 
                    versionsTable(library, packagesState) 
                ] 
            }
        ]
    }
}


function versionsTable( library: Library, packagesState: PackagesState) : VirtualDOM {

    return {
        tag: 'table', 
        class:'fv-color-primary  w-100 text-center',
        children:[
            {   tag:'thead',
                children:[
                    {   tag: 'tr', class:'fv-bg-background-alt',
                        children: [
                            { tag: 'td', innerText:'Local versions'},
                            { tag: 'td', innerText:'Published versions'},
                            { tag: 'td', innerText:''}
                        ] 
                    }
                ]
            },
            {   tag:'tbody',
                children: library.releases.map( release => {
                    return {
                        tag: 'tr',
                        class: 'fv-hover-bg-background-alt',
                        children: [
                            {   tag: 'td', innerText:release.version },
                            {   tag: 'td', 
                                children:[
                                    {
                                        tag:'i',
                                        class: attr$(
                                            packagesState.publishStatus$(library.assetId,release.version),
                                            (status) => {
                                                return statusClassesDict[status]
                                            },
                                            {   untilFirst: 'fas fa-spin fa-spinner',
                                                wrapper: (d) => d + " px-2"
                                            }
                                        )
                                    },
                                    {
                                        tag:'i',
                                        class: attr$(
                                            packagesState.librariesStatus$[library.assetId],
                                            ({status, details}) => {
                                                if( !details || details.version != release.version )                                                    
                                                    return '' 
                                                if( status != StatusEnum.PROCESSING || 
                                                    details.version != release.version )
                                                    return ''
                                                if( details.version == release.version )                                                    
                                                    return 'fas fa-spin fa-spinner'     
                                            }
                                        )
                                    }
                                ]
                            },
                            child$( 
                                packagesState.librariesStatus$[library.assetId],
                                () =>  publishPackageVersionBttn(library, release.version)
                            )
                        ]
                    }
                })
            }
        ]
    } 
}

function publishPackageVersionBttn( library: Library, version: string) : VirtualDOM {

    return {
        tag: 'td',
        class: "mx-2",
        children:[
            {
                tag:'i',
                class: 'fas fa-cloud-upload-alt fv-hover-text-focus p-2 fv-pointer',
                onclick: () => 
                    Backend.uploadPackages.publishLibraryVersion$(library.assetId, version).subscribe()
            },
            {}
        ]
    }
}


function syncBttn( assetId: string ) : VirtualDOM  {

    let btn = button('fas fa-sync', 'Sync.')
    btn.state.click$.subscribe( (d) => {
        Backend.uploadPackages.syncPackage$(assetId).subscribe()
    })
    return btn
}
