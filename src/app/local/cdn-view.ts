import { VirtualDOM, child$, HTMLElement$ } from '@youwol/flux-view'
import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { PackagesStatus, Package, PackageDetails, VersionDetails } from '../backend/local-cdn.router';
import { Backend } from '../backend/router';
import { filesBrowserView } from '../shared-views/files-browser.view';
import { innerTabClasses } from "../utils-view";
import * as _ from 'lodash'


export class CdnState {

    packagesStatus$ = Backend.localCdnPackages.packagesStatus$
    packageDetails$ = Backend.localCdnPackages.packageDetails$
    selectedPackageVersion$ = new BehaviorSubject<VersionDetails>(undefined)
    
    webSocket$: ReplaySubject<any>
    constructor() {
        this.webSocket$ = Backend.localCdnPackages.connectWs()

    }

    subscribe() {
        let s0 = this.packagesStatus$.subscribe(data => console.log("packagesStatus", data))
        let s1 = this.packageDetails$.subscribe(data => console.log("packageDetails", data))
        let s2 = Backend.localCdnPackages.status$().subscribe()
        return [s0, s1]
    }

    getPackageDetails(name: string) {
        Backend.localCdnPackages.getPackageDetails$(name).subscribe()
    }

    selectPackageVersion(versionInfo: VersionDetails){
        this.selectedPackageVersion$.next(versionInfo)
    }

}

export class CdnView implements VirtualDOM {

    public readonly tag = 'div'
    public readonly children: Array<VirtualDOM>
    public readonly class = innerTabClasses
    public readonly state: CdnState

    connectedCallback: (elem) => void

    constructor(state: CdnState) {

        this.state = state

        this.children = [
            {
                class: 'd-flex h-100 justify-content-around',
                children: [
                    child$(
                        this.state.packagesStatus$,
                        (status) => this.packagesTable(status)
                    ),
                    {
                        class: 'd-flex flex-column h-100 px-2',
                        style:{ maxWidth: '50%'},
                        children:[
                            child$(
                                this.state.packageDetails$,
                                (details) => details ? this.packageDetails(details) : {}
                            ),
                            child$(
                                this.state.selectedPackageVersion$,
                                (versionDetail) => {
                                    return versionDetail ? this.packageBrowserView(versionDetail) : {}
                                }
                            )
                        ]
                    }
                ]
            }
        ]

        this.connectedCallback = (elem: HTMLElement$) => {
            elem.ownSubscriptions(...this.state.subscribe())
        }
    }

    packagesTable(allStatus: PackagesStatus): VirtualDOM {

        return {
            class: 'overflow-auto h-100',
            children: [
                {
                    tag: 'table', class: 'fv-color-primary  w-100 text-center',
                    style: { 'max-height': '100%' },
                    children: [
                        {
                            tag: 'thead',
                            children: [
                                {
                                    tag: 'tr', class: 'fv-bg-background-alt',
                                    children: [
                                        { tag: 'td', innerText: 'Name', class: 'px-2' },
                                        { tag: 'td', innerText: 'Version count', class: 'px-2' },
                                        { tag: 'td', innerText: 'Latest version', class: 'px-2' },
                                        { tag: 'td', innerText: '', class: 'px-2' }
                                    ]
                                }
                            ]
                        },
                        {
                            tag: 'tbody',
                            children: allStatus.packages
                                .map((library: Package) => {
                                    return {
                                        tag: 'tr',
                                        class: 'fv-hover-bg-background-alt fv-pointer',
                                        children: [
                                            nameCell(library),
                                            versionsCountCell(library),
                                            latestVersionCell(library),
                                            deletePackageCell(library.name)
                                        ],
                                        onclick: () => {
                                            this.state.getPackageDetails(library.name) 
                                            this.state.selectPackageVersion(undefined)
                                        }
                                    }
                                })
                        }
                    ]
                }
            ]
        }
    }

    packageDetails(pack: PackageDetails): VirtualDOM {

        return {
            class: 'overflow-auto',
            style: {
                maxHeight:'50%',
            },
            children: [
                {   tag:'h4',
                    class: 'fv-text-focus',
                    innerText: pack.name
                },
                {
                    tag: 'table', class: 'fv-color-primary  w-100 text-center',
                    style: { 'max-height': '100%' },
                    children: [
                        {
                            tag: 'thead',
                            children: [
                                {
                                    tag: 'tr', class: 'fv-bg-background-alt',
                                    children: [
                                        { tag: 'td', innerText: 'Version', class: 'px-2' },
                                        { tag: 'td', innerText: 'files count', class: 'px-2' },
                                        { tag: 'td', innerText: 'bundle size (Ko)', class: 'px-2' },
                                        { tag: 'td', innerText: '', class: 'px-2' }
                                    ]
                                }
                            ]
                        },
                        {
                            tag: 'tbody',
                            children: pack.versions
                                .map((packVersion: VersionDetails) => {
                                    return {
                                        tag: 'tr',
                                        class: 'fv-hover-bg-background-alt',
                                        onclick: () => this.state.selectPackageVersion(packVersion),
                                        children: [
                                            { tag: 'td', innerText: packVersion.version, class: 'px-2' },
                                            { tag: 'td', innerText: packVersion.filesCount, class: 'px-2' },
                                            { tag: 'td', innerText: Math.floor(packVersion.bundleSize/100) /10, class: 'px-2' },
                                            deleteVersionCell(pack.name, packVersion.version)
                                        ]
                                    }
                                })
                        }
                    ]
                }
            ]
        }
    }

    packageBrowserView(versionInfo: VersionDetails): VirtualDOM{
        
        let pattern = versionInfo.namespace == ""
            ? `/libraries/${versionInfo.name}`
            : `/libraries/${versionInfo.namespace}/${versionInfo.name}`

        let index = versionInfo.path.join('/').split(pattern)[0].split('/').length - 2

        let view = filesBrowserView({
            startingFolder: versionInfo.path, 
            originFolderIndex: index
        })
        return {
            class:'w-100 py-2 flex-grow-1',
            children:[
                {   tag:'h4',
                    class: 'fv-text-focus',
                    innerText: 'Browser'
                },
                view
            ]
        }
    }
}


function nameCell(library: Package) {
    return { tag: 'td', innerText: library.name, class: 'px-2' }
}


function versionsCountCell(library: Package) {
    return { tag: 'td', innerText: library.versions.length, class: 'px-2' }
}


function latestVersionCell(library: Package) {
    return { tag: 'td', innerText: library.versions[0].version, class: 'px-2' }
}

function deleteVersionCell(name: string, version: string) {
    return { tag: 'td', children:[
        {
            class:'fas fa-trash fv-text-error px-2 fv-pointer',
            onclick:() => {
                if(confirm(`Are you sure you want to remove ${name}@${version} from local CDN`))
                    Backend.localCdnPackages.deleteVersion$(name, version).subscribe()
            }
        }
        ]
    }
}

function deletePackageCell(name: string) {
    return { tag: 'td', children:[
        {
            class:'fas fa-trash fv-text-error px-2 fv-pointer',
            onclick:() => {
                if(confirm(`Are you sure you want to remove ${name} (all versions) from local CDN`))
                    Backend.localCdnPackages.deletePackage$(name).subscribe()
            }
        }
        ]
    }
}