import { HTMLElement$, VirtualDOM } from '@youwol/flux-view'
import { Tabs } from '@youwol/fv-tabs'
import { BehaviorSubject, Subject } from 'rxjs';
import { Package } from '../backend/upload-packages.router';
import { PanelId } from '../panels-info';
import { detailsView } from './packages/package-details-view';
import { PackagesState,PackagesView } from './packages/packages-view';
import * as FluxApps from './flux-apps/flux-apps-view'

class PackagesTabData extends Tabs.TabData{

    constructor(public readonly packagesState: PackagesState){
        super(PanelId.AssetsUploadPackages,'Packages')
    }

    view() {
        return new PackagesView(this.packagesState)
    }
}

class PackageTabData extends Tabs.TabData{

    constructor(
        public readonly library: Package, 
        public readonly packagesState: PackagesState){
        super(library.name, library.name)
    }

    view() {
        return detailsView( 
            this.library,  
            this.packagesState)
    }
}

class FluxAppsTabData extends Tabs.TabData{

    constructor(public readonly state: FluxApps.State){
        super(PanelId.AssetsUploadFluxApps,'Flux Apps')
    }

    view() {
        return new FluxApps.View(this.state)
    }
}

export class AssetsUploadState{
    
    public readonly packagesState: PackagesState
    public readonly fluxAppsState: FluxApps.State
    
    public readonly tabsData$ : BehaviorSubject< Tabs.TabData[]>

    public readonly selectedTab$ :BehaviorSubject<string> = new BehaviorSubject("packages")

    constructor(public readonly selectedPanel$: Subject<PanelId>){

        this.packagesState = new PackagesState(this)
        this.fluxAppsState = new  FluxApps.State(this)
        selectedPanel$.subscribe( (d) => {
            this.selectedTab$.next(d) 
        })
        this.tabsData$ = new BehaviorSubject< Tabs.TabData[]>([
            new PackagesTabData(this.packagesState),
            new FluxAppsTabData(this.fluxAppsState)
        ])
    }

    addTabUpload( library: Package ) {

        //this.appState.addTabUpload(name)
        if( this.tabsData$.getValue().find( tab => tab instanceof PackageTabData && tab.id == library.name))
            return 
        this.tabsData$.next([ 
            ...this.tabsData$.getValue(), 
            new PackageTabData(library, this.packagesState) 
        ])
        this.selectedTab$.next(library.name)
    }
    removeTabUpload( name ) {
        if( this.selectedTab$.getValue() == name )
            this.selectedTab$.next(this.tabsData$.getValue()[0].id)
        
        this.tabsData$.next(this.tabsData$.getValue().filter( (tab) => tab.name != name))
    }
}

class AssetsTabsState extends Tabs.State{

    constructor(public readonly assetsState: AssetsUploadState){
        super(assetsState.tabsData$, assetsState.selectedTab$)
    }
}

export class AssetsUploadView implements VirtualDOM{

    public readonly tag = 'div'
    public readonly children : Array<VirtualDOM> 
    public readonly class = 'p-2 h-100 flex-grow-1'

    connectedCallback: (elem) => void
    
    constructor(state:AssetsUploadState){
        
        let tabsState = new AssetsTabsState(state)
        this.children = [
            new Tabs.View({
                class:'d-flex flex-column h-100', 
                state: tabsState,
                headerView: headerViewTab,
                contentView: (tabState, tabData) => tabData.view() 
            } as any)
        ]

        this.connectedCallback = (elem : HTMLElement$) => {
            elem.ownSubscriptions(...state.packagesState.subscribe())
        }
    }
}


function headerViewTab(state: AssetsTabsState, tab: Tabs.State) {

    if(tab instanceof PackagesTabData)
        return {innerText: tab.name, class:'px-2'}

    if(tab instanceof FluxAppsTabData)
        return {innerText: tab.name, class:'px-2'}

    if(tab instanceof PackageTabData)
        return {
            class: 'd-flex align-items-center px-2',
            children:[
                { 
                    innerText: tab.name, class:'px-2'},
                { 
                    class: 'fas fa-times fv-pointer p-1 ',
                    onclick: (ev: MouseEvent) => {
                        state.assetsState.removeTabUpload(tab.name)
                        ev.stopPropagation() 
                    }
                },
            ] 
        }
}