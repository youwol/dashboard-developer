import { VirtualDOM } from '@youwol/flux-view'
import { Tabs } from '@youwol/fv-tabs'
import { BehaviorSubject, Subject } from 'rxjs'
import { PanelId } from '../sidebar-view'
import { GeneralState, GeneralView } from './general.view'
import { PackagesState } from './package.view'
import { RawfileView } from './raw-file.view'



let titles = {
    [PanelId.ConfigurationGeneral] :'General',
    [PanelId.ConfigurationRawFile] :'Raw file',
}
export class ConfigurationState{

    logMessages$ = new Subject<string>()

    generalState = new GeneralState()
    packageState = new PackagesState()
    
    constructor(public readonly selectedPanel$: BehaviorSubject<PanelId>){}
}

class GeneralTabData extends Tabs.TabData{
    
    constructor(public readonly generalState){
        super( PanelId.ConfigurationGeneral, titles[PanelId.ConfigurationGeneral])
    }
    view() {
        return new GeneralView(this.generalState)
    }
}
class RawFileTabData extends Tabs.TabData{
    
    constructor(public readonly generalState){
        super( PanelId.ConfigurationRawFile, titles[PanelId.ConfigurationRawFile])
    }
    view() {
        return new RawfileView()
    }
}


export class ConfigurationView implements VirtualDOM{

    public readonly tag = 'div'
    public readonly children : Array<VirtualDOM> 
    public readonly class = 'p-2 h-100 flex-grow-1'
    public readonly state : ConfigurationState

    constructor(state:ConfigurationState){

        let tabsData = [
            new GeneralTabData(state.generalState),
            new RawFileTabData(state.generalState)
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