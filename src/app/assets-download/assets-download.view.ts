import { HTMLElement$, VirtualDOM } from '@youwol/flux-view'
import { Tabs } from '@youwol/fv-tabs'
import { BehaviorSubject, Subject } from 'rxjs';
import { Package } from '../backend/upload-packages.router';
import { PanelId } from '../panels-info';
import { PackagesState, PackagesView } from './packages-view';


class PackageTabData extends Tabs.TabData{

    packagesState : PackagesState

    constructor(){
        super("Packages", "Packages")
        this.packagesState = new PackagesState()
    }

    view() {
        return new PackagesView(this.packagesState)
    }
}


class TabsState extends Tabs.State{

    constructor(state: AssetsDownloadState){
        super([new PackageTabData()])
    }
}


export class AssetsDownloadState{

    constructor(public readonly selectedPanel$: Subject<PanelId>){
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