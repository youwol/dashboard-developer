import { HTMLElement$, VirtualDOM } from '@youwol/flux-view'
import { Tabs } from '@youwol/fv-tabs'
import { BehaviorSubject, Subject } from 'rxjs';
import { Package } from '../backend/upload-packages.router';
import { PanelId } from '../panels-info';
import { detailsView } from './packages/package-details-view';
import { PackagesState,PackagesView } from './packages/packages-view';
import { Library } from './packages/utils';


class PackagesTabData extends Tabs.TabData{

    constructor(public readonly packagesState: PackagesState){
        super('packages','Packages')
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

export class AssetsState{
    
    public readonly packagesState: PackagesState
    
    public readonly tabsData$ : BehaviorSubject< Tabs.TabData[]>

    public readonly selectedTab$ = new BehaviorSubject("packages")

    constructor(public readonly selectedPanel$: Subject<PanelId>){

        this.packagesState = new PackagesState(this)

        this.tabsData$ = new BehaviorSubject< Tabs.TabData[]>([
            new PackagesTabData(this.packagesState)
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

    constructor(public readonly assetsState: AssetsState){
        super(assetsState.tabsData$, assetsState.selectedTab$)
    }
}

export class AssetsView implements VirtualDOM{

    public readonly tag = 'div'
    public readonly children : Array<VirtualDOM> 
    public readonly class = 'p-2 h-100 flex-grow-1'

    connectedCallback: (elem) => void
    
    constructor(state:AssetsState){
        
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