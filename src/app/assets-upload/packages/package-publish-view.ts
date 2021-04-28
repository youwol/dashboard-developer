import { attr$, child$, VirtualDOM } from "@youwol/flux-view";
import { combineLatest } from "rxjs";
import { delay, map } from "rxjs/operators";
import { button } from "../../utils-view";
import { PackagesState } from "./packages-view";
import { Library,  statusClassesDict, StatusEnum } from "./utils";



export function publishView(
    libraries: Array<Library>, 
    state: PackagesState
    ) : VirtualDOM {
    
    return {
        class:'d-flex flex-column border fv-color-primary',
        style:{
            height:'fit-content',
            'max-height': '100%'
        },
        children: [
        {   class:"overflow-auto",
            children:[ 
                syncTable(libraries, state) 
            ] 
        },
        {   class: 'd-flex align-items-baseline',
            children:[
                child$( 
                    state.syncQueued$, 
                    (toSync) => syncHeader(toSync, state) 
                )
            ]
        },
    ]}
}

function syncHeader(selection: Set<string> , state: PackagesState) : VirtualDOM  {

    let content = {}
    if(selection.size==0)
        content = { innerText: 'No items selected for synchronization' , class:'fv-text-focus'}
    else{
        let btn = button('fas fa-sync', `Sync. (${selection.size})`)
        btn.state.click$.subscribe( (d) => state.synchronize())
        content = btn
    }
    return {
        class:'w-100',
        children:[
            { class:" border fv-color-primary" },
            { 
                class:'m-3',
                children:[content]
            }
        ]   
    }
}


export function syncTable( 
    libraries: Array<Library>, 
    state: PackagesState
    ) : VirtualDOM {

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
        class:'w-100 text-center',
        children:[
            {   tag:'thead',
                children:[
                    {   tag: 'tr', class:'fv-bg-background-alt',
                        children: [
                            { tag: 'td', innerText:'Name', class:'px-3'},
                            { tag: 'td', innerText:'Version', class:'px-3'},
                            { tag: 'td', innerText:'Status', class:'px-3'},
                            { tag: 'td', innerText:'Queued?', class:'px-3'}
                        ] 
                    }
                ]
            },
            {   tag:'tbody',
                children: flattenLibraries.map( ({assetId, libraryName, version}) => {
                    return {
                        tag: 'tr',
                        class: attr$(
                            combineLatest([state.options$, state.publishStatus$(assetId, version)])
                            .pipe(
                                map( ([{showSynced, showNext}, status]) => {
                                    if(showSynced && showNext)
                                        return true
                                    if(!showSynced && status == StatusEnum.SYNC)
                                        return false

                                    if(!showNext && version.includes('-next'))
                                        return false
                                    return true
                                })
                                ),
                            (display) => display ? '' : 'd-none',
                            { wrapper: (d) => d + ' fv-pointer fv-hover-bg-background-alt'}
                            ),
                        children: [
                            {   tag: 'td', innerText:libraryName },
                            {   tag: 'td', innerText:version },
                            {   tag: 'td',
                                children:[
                                    {
                                        class: attr$(
                                            state.publishStatus$(assetId, version),
                                            (status) => statusClassesDict[status]
                                        )
                                    }
                                ]
                            },
                            {
                                tag:'input',
                                type:'checkbox',
                                checked: attr$(
                                    state.isToggled$(assetId, version),
                                    (toggled) => toggled,
                                ),
                                onclick: ()=> state.toggleSync(assetId, version)
                            }
                        ]
                    }
                })
            }
        ]
    } 
}
