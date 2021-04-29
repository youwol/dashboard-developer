import { attr$, child$, VirtualDOM } from "@youwol/flux-view";
import { Observable } from "rxjs";
import { Backend } from "../../backend";
import { Library, LibraryStatus, statusClassesDict, StatusEnum } from "./utils";
import { LogsView } from "../../logs-view";
import { PackagesState } from "./packages-view";
import { ExpandableGroup } from "@youwol/fv-group";
import { mergeMap } from "rxjs/operators";



export function detailsView( 
    library: Library,  
    packagesState : PackagesState
    ) : VirtualDOM {
    
    let libraryStatus$ = packagesState.librariesStatus$[library.assetId]
    

    return { 
        class: "h-100 d-flex flex-column w-100 fv-bg-background-alt fv-color-primary",
        children:[
            {
                class: 'h-100 d-flex flex-column fv-bg-background p-3  overflow-auto',
                children:[
                    title(library, libraryStatus$),
                    { tag:'hr', class:'w-100 fv-color-primary'},
                    explorerGroup(library),
                    versionsStatusGroup(library, packagesState)
                ]  
            },
            new LogsView(packagesState.logsState)
        ]
    }
}


function explorerGroup(library: Library){

    let state = new ExpandableGroup.State("Explorer", false)
    let contentView = (state:ExpandableGroup.State) => {
        return {
            class:'my-2 h-100 w-100' , style:{'white-space':'nowrap'},
            children: [
                { 
                    class: "d-flex justify-content-around",
                    children:[
                        { innerText: 'Local reference' },
                        { innerText: 'Remote reference' }
                    ] 
                },
                {   class: "d-flex justify-content-around",
                    children:[
                        {   class:'w-50 d-flex justify-content-center',
                            children:[
                                child$(
                                    Backend.uploadPackages.path$(library.treeItems[0].itemId),
                                    (pathResponse) => explorerCard(pathResponse)
                                )
                            ]
                        },
                        {   class:'w-50  d-flex justify-content-center',
                            children:[
                                child$(
                                    Backend.environment.environments$.pipe(
                                        mergeMap( () =>  Backend.uploadPackages.remotePath$(library.assetId) )
                                    ),
                                    (pathResponse) => {
                                        return pathResponse.group && pathResponse.drive && pathResponse.folders
                                        ? explorerCard(pathResponse) 
                                        : { class: "fas fa-times fv-text-error" }
                                    }, 
                                    { untilFirst: { class: 'fas fa-spinner fa-spin fv-text-primary mx-auto my-auto'}}
                                )
                            ]
                        }
                    ]
                }
                /*{ 
                    class: 'd-flex overflow-auto',
                    children:[
                        child$(
                            Backend.uploadPackages.remotePath$(library.assetId),
                            (pathResponse) => explorerCard(pathResponse),
                            { untilFirst: { class: 'fas fa-spinner fa-spin fv-text-primary'}}
                        )
                    ]
                }*/
            ]
        }
    }
    return new ExpandableGroup.View({
        state,
        headerView,
        contentView,
        class:'mb-3'
    } as any)
}


function versionsStatusGroup( library: Library, packagesState: PackagesState ) : VirtualDOM{

    let state = new ExpandableGroup.State("CDN versions", true)

    let contentView = () => {
        return {   
            class:'d-flex justify-content-center', 
            children:[ 
                versionsTable(library, packagesState) 
            ] 
        }
    }
    return new ExpandableGroup.View({
        state,
        headerView,
        contentView,
        class:'mb-3'
    } as any)
}


function headerView(state:ExpandableGroup.State ) {

    return ExpandableGroup.defaultHeaderView(state)
}

function title(library: Library, libraryStatus$: Observable<LibraryStatus>) : VirtualDOM {

    return {   
        class: 'd-flex justify-content-center align-items-center ',
        children:[
            {   tag:'h3', 
                class:'text-center my-2',
                innerText: library.libraryName
            },
            {
                class: attr$(
                    libraryStatus$,
                    ({status}) => statusClassesDict[status],
                    {wrapper:(d) => d + ' mx-2 fa-2x'}
                )
            }
        ]
    }
}


function explorerCard( {group, drive, folders} ) : VirtualDOM {

    return {
        class: 'border rounded fv-color-primary p-2 mx-2',
        style: {width:'fit-content'},
        children:[
            {   class: 'd-flex align-items-center',
                children:[
                    {   
                        tag:'i',
                        class:'fas fa-users px-2'
                    },
                    {
                        innerText: group,
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
                        innerText: drive.name,
                    }
                ]
            },
            {   
                class: 'd-flex align-items-center',
                children:[
                    {   
                        tag:'i',
                        class:'fas fa-folder px-2'
                    },
                    {   innerText: folders.reduce( (acc,e) => acc+' / '+e.name,"")             
                    }
                ]                                        
            }
        ]
    }
}


function versionsTable( library: Library, packagesState: PackagesState) : VirtualDOM {

    return {
        tag: 'table', 
        class:'fv-color-primary text-center my-3',
        children:[
            {   tag:'thead',
                children:[
                    {   tag: 'tr', class:'fv-bg-background-alt',
                        children: [
                            { tag: 'td', innerText:'Local versions', class:'px-3'},
                            { tag: 'td', innerText:'Published versions', class:'px-3'},
                            { tag: 'td', innerText:'', class:'px-3'}
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
                            {   tag: 'td', innerText:release.version, class:'px-3' },
                            {   tag: 'td', class:'px-3', 
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
