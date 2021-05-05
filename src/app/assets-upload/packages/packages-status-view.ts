import { attr$, child$, VirtualDOM } from "@youwol/flux-view"
import { combineLatest, merge, Observable, Subject } from "rxjs"
import { delay, filter, map } from "rxjs/operators"
import { Package, PackageStatus, ProcessingPackage, ResolvedPackage } from '../../backend/upload-packages.router'
import { Backend } from "../../backend/router"
import { Options, PackagesState } from "./packages-view"

import { Library, LibraryStatus, statusClassesDict, StatusEnum } from "./utils"


export function tableView(
    packages: Array<Package>, 
    options: Options,
    selected$ : Subject<Package>, 
    state: PackagesState
    ): VirtualDOM {


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
                                children: packages.map( (pack: Package) => {
                                    let classes = 'fv-pointer fv-hover-bg-background-alt '
                                    if( pack.status instanceof ResolvedPackage 
                                        && !options.showSynced
                                        && pack.status.cdnStatus == StatusEnum.SYNC 
                                        && pack.status.treeStatus == StatusEnum.SYNC){
                                        classes += 'd-none'
                                    }
                                    return {
                                        tag: 'tr',
                                        class:  classes,
                                        children: [
                                            {
                                                tag: 'td', innerText: pack.name, class:'px-3'
                                            },
                                            statusCellCDN( pack, state  ),
                                            statusCellAsset(pack, state)
                                        ],
                                        onclick: () => selected$.next(pack)
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

function statusCellCDN( pack: Package, state: PackagesState ) {

    let classes = ""
    if(pack.status instanceof ProcessingPackage)
        classes = 'fas fa-spinner fa-spin'

    if(pack.status instanceof ResolvedPackage)
        classes = statusClassesDict[pack.status.cdnStatus]

    return {
        tag: 'td',
        children:[
            {
                class: classes
            }
        ]
    }
}

function statusCellAsset( pack: Package, state: PackagesState ) {

    let classes = ""
    let uploadChild = {}
    if(pack.status instanceof ProcessingPackage)
        classes = 'fas fa-spinner fa-spin'

    if(pack.status instanceof ResolvedPackage){
        classes = statusClassesDict[pack.status.treeStatus]  
        if(pack.status.treeStatus != StatusEnum.SYNC)
            uploadChild = {
                class: "fas fa-cloud-upload-alt fv-hover-text-focus fv-pointer",
                onclick: (ev:MouseEvent) => {
                    Backend.uploadPackages.registerAsset(pack.assetId).subscribe();
                    ev.stopPropagation()
                }
            }
    }

    return {
        tag: 'td',
        class:'d-flex align-items-center justify-content-around my-auto',
        children:[
            {
                class: classes
            },
            uploadChild
        ]
    }
}