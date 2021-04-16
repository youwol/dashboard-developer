import { VirtualDOM } from '@youwol/flux-view'
import { Tabs } from '@youwol/fv-tabs'
import { Subject } from 'rxjs';
import { PanelId } from '../sidebar-view';
import { PackagesState,PackagesView } from './packages-view';


export class AssetsState{
    
    packagesState = new PackagesState()
    
    constructor(public readonly selectedPanel$: Subject<PanelId>){
    }
}

class PackagesTabData extends Tabs.TabData{

    constructor(public readonly packagesState: PackagesState){
        super('packages','Packages')
    }

    view() {
        return new PackagesView(this.packagesState)
    }
}

export class AssetsView implements VirtualDOM{

    public readonly tag = 'div'
    public readonly children : Array<VirtualDOM> 
    public readonly class = 'p-2 h-100 flex-grow-1'

    constructor(state:AssetsState){

        let tabsData = [
            new PackagesTabData(state.packagesState)
        ]
        
        this.children = [
            new Tabs.View({
                class:'d-flex flex-column h-100', 
                state: new Tabs.State(tabsData),
                headerView: (state, tab) => ({innerText: tab.name, class:'px-2'}),
                contentView: (tabState, tabData) => tabData.view() 
            } as any)
        ]
    }
}
