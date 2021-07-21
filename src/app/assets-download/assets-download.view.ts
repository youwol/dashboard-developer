import { HTMLElement$, VirtualDOM } from '@youwol/flux-view'
import { Tabs } from '@youwol/fv-tabs'
import { BehaviorSubject, Subject } from 'rxjs';
import { Package } from '../backend/upload-packages.router';
import { PanelId, tabsDisplayInfo } from '../panels-info';
import { PackagesState, PackagesView } from './packages-view';
import * as FluxApp from './flux-project.view'

class PackageTabData extends Tabs.TabData{

    packagesState : PackagesState

    constructor(){
        super(PanelId.AssetsDownloadPackages, tabsDisplayInfo[PanelId.AssetsDownloadPackages].title)
        this.packagesState = new PackagesState()
    }

    view() {
        return new PackagesView(this.packagesState)
    }
}

class FluxAppsTabData extends Tabs.TabData{


    constructor(public readonly state: FluxApp.State){
        super(PanelId.AssetsDownloadFluxApps, tabsDisplayInfo[PanelId.AssetsDownloadFluxApps].title)
    }

    view() {
        return new FluxApp.View(this.state)
    }
}


class TabsState extends Tabs.State{

    constructor(state: AssetsDownloadState){
        super([
            new PackageTabData(), 
            new FluxAppsTabData(new FluxApp.State(state))
        ],state.selectedPanel$)
    }
}


export class AssetsDownloadState{

    constructor(public readonly selectedPanel$: BehaviorSubject<PanelId>){
    }

}

export class AssetsDownloadView implements VirtualDOM{

    public readonly tag = 'div'
    public readonly children : Array<VirtualDOM> 
    public readonly class = 'p-2 h-100 flex-grow-1'

    connectedCallback: (elem) => void
    
    constructor(state:AssetsDownloadState){
        
        let tabsState = new TabsState(state)
        this.children = [
            new Tabs.View({
                class:'d-flex flex-column h-100', 
                state: tabsState,
                headerView: headerViewTab,
                contentView: (tabState, tabData) => tabData.view() 
            } as any)
        ]

        this.connectedCallback = (elem : HTMLElement$) => {
        }
    }
}


function headerViewTab(state: TabsState, tab: Tabs.TabData) {

    return {innerText: tab.name, class:'px-2'}
}