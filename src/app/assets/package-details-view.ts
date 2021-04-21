import { attr$, child$, VirtualDOM } from "@youwol/flux-view";
import { Observable } from "rxjs";
import { filter } from "rxjs/operators";
import { button } from "../utils-view";
import { Backend } from "../backend";
import { Library, LibraryStatus, statusClassesDict, statusColorsDict, StatusEnum, statusInfoDict } from "./utils";



export function detailsView( library: Library,  libraryStatus$ : Observable<LibraryStatus>) : VirtualDOM {
    
    return {
        class: attr$(
            libraryStatus$,
            ({status}) => statusColorsDict[status],
            {   untilFirst: 'h-100 d-flex flex-column fv-bg-background p-3 overflow-auto',
                wrapper: (d) => d +  ' h-100 d-flex flex-column fv-bg-background p-3  overflow-auto'
            }
        ),
        style:{'border-width':'3px'},
        children:[
            title(library),
            statusInfo(libraryStatus$),
            {
                class:'d-flex flex-grow-1', style:{height:'0px'},
                children:[
                    explorerStatus(library),
                    versionsStatus(library, libraryStatus$)
                ]
            }
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


function versionsStatus( library: Library, libraryStatus$ : Observable<LibraryStatus> ) : VirtualDOM{

    return {   
        class:'h-100 w-50 d-flex flex-column', style:{height:'0px'},
        children: [
            {   tag:'h5' , innerText: 'Versions' },
            {   class:"flex-grow-1 overflow-auto",
                children:[ 
                    versionsTable(library, libraryStatus$) 
                ] 
            }
        ]
    }
}


function versionsTable( library: Library, libraryStatus$ : Observable<LibraryStatus>) : VirtualDOM {

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
                                            libraryStatus$.pipe(filter( ({status}) => {
                                                return [StatusEnum.NOT_FOUND,StatusEnum.MISMATCH,
                                                    StatusEnum.SYNC].includes(status)
                                            })),
                                            ({status, details}) => {
                                                if(status==StatusEnum.NOT_FOUND || status==StatusEnum.SYNC )
                                                    return statusClassesDict[status]
        
                                                if( status==StatusEnum.MISMATCH &&
                                                    details.missing.includes(release.version))
                                                    return 'fv-text-error fas fa-times'
        
                                                if( status==StatusEnum.MISMATCH &&
                                                    details.sync.includes(release.version))
                                                    return 'fv-text-success fas fa-check'  

                                                if( status==StatusEnum.MISMATCH &&
                                                    details.mismatch.includes(release.version))
                                                    return 'fv-text-focus fas fa-exclamation'  
                                            },
                                            {   untilFirst: 'fas fa-spin fa-spinner',
                                                wrapper: (d) => d + " px-2"
                                            }
                                        )
                                    },
                                    {
                                        tag:'i',
                                        class: attr$(
                                            libraryStatus$,
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
                                libraryStatus$,
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
