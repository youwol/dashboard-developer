import { VirtualDOM } from '@youwol/flux-view'
import { Tabs } from '@youwol/fv-tabs'
import { FrontendsState, FrontendsView } from './frontends-view'
import { ModulesState, ModulesView } from './modules-view'
import { BackendsState, BackendsView } from './backends-view'
import { BehaviorSubject, Subject } from 'rxjs'
import { PanelId } from '../panels-info'




let titles = {
    [PanelId.LocalEnvPackage] :'Packages',
    [PanelId.LocalEnvFronts] : 'Front Ends',
    [PanelId.LocalEnvBacks] : 'Back Ends',
}
export class LocalState{

    logMessages$ = new Subject<string>()

    modulesState = new ModulesState()
    frontendsState = new FrontendsState()
    backendsState = new BackendsState()

    
    constructor(public readonly selectedPanel$: BehaviorSubject<PanelId>){}
}

class ModulesTabData extends Tabs.TabData{
    
    constructor(public readonly modulesState){
        super( PanelId.LocalEnvPackage, titles[PanelId.LocalEnvPackage])
    }
    view() {
        return new ModulesView(this.modulesState)
    }
}

class FrontEndsTabData extends Tabs.TabData{

    constructor(public readonly frontEndsState: FrontendsState){
        super(PanelId.LocalEnvFronts,titles[PanelId.LocalEnvFronts])
    }
    view() {
        return new FrontendsView(this.frontEndsState)
    }
}

class BackendsTabData extends Tabs.TabData{

    constructor(public readonly backendsState){
        super(PanelId.LocalEnvBacks, titles[PanelId.LocalEnvBacks])
    }
    view() {
        return new BackendsView(this.backendsState)
    }
}

export class LocalView implements VirtualDOM{

    public readonly tag = 'div'
    public readonly children : Array<VirtualDOM> 
    public readonly class = 'p-2 h-100 flex-grow-1'
    public readonly state : LocalState

    constructor(state:LocalState){

        let tabsData = [
            new ModulesTabData(state.modulesState),
            new FrontEndsTabData(state.frontendsState),
            new BackendsTabData(state.backendsState),
        ]
        
        this.children = [
            new Tabs.View({
                class:'d-flex flex-column h-100', 
                state: new Tabs.State(tabsData, state.selectedPanel$ ),
                headerView: (state, tab) => ({innerText: tab.name, class:'px-2'}),
                contentView: (tabState, tabData) => tabData.view()
            } as any)
        ]
    }
}