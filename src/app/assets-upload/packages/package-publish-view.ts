import { attr$, child$, VirtualDOM } from "@youwol/flux-view";
import { combineLatest } from "rxjs";
import { delay, map } from "rxjs/operators";
import { PackageVersion } from "src/app/backend/upload-packages.router";
import { button } from "../../utils-view";
import { Options, PackagesState } from "./packages-view";
import { Library,  statusClassesDict, StatusEnum } from "./utils";



export function publishView(
    versions: Array<PackageVersion>, 
    options: Options,
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
                syncTable(versions, options, state) 
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
    versions: Array<PackageVersion>, 
    options: Options,
    state: PackagesState
    ) : VirtualDOM {
        
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
                children: versions.map( ({assetId, name, version, status}) => {
                    let classes = 'fv-pointer fv-hover-bg-background-alt '
                    if(  (!options.showSynced && status == StatusEnum.SYNC) ||
                         (!options.showNext && version.includes('-next'))   ){
                        classes += 'd-none'
                    }

                    return {
                        tag: 'tr',
                        class: classes,
                        children: [
                            {   tag: 'td', innerText:name },
                            {   tag: 'td', innerText:version },
                            {   tag: 'td',
                                children:[
                                    {
                                        class: statusClassesDict[status]
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
