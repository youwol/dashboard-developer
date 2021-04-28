import { BehaviorSubject } from "rxjs"
import { map } from "rxjs/operators"
import { AssetsState, AssetsView } from "./assets/assets-view"
import { ConfigurationState, ConfigurationView } from "./environment/environment.view"
import { LocalState, LocalView } from "./local/local-view"
import { PanelId, tabsDisplayInfo } from "./panels-info"

export class AppState{

    public readonly environmentChildren$ = new BehaviorSubject([PanelId.ConfigurationGeneral, PanelId.ConfigurationRawFile])
    public readonly localChildren$ = new BehaviorSubject([PanelId.LocalEnvPackage,PanelId.LocalEnvFronts,PanelId.LocalEnvBacks])
    public readonly uploadChildren$ = new BehaviorSubject([PanelId.AssetsUploadPackages])


    public readonly selected$ = new BehaviorSubject<PanelId>(PanelId.ConfigurationGeneral)

    localState = new LocalState(this.selected$)
    assetsState = new AssetsState(this.selected$, this)
    configurationState = new ConfigurationState(this.selected$)

    panelViewFactory$ = this.selected$.pipe(
        map( selected => {
    
            if ([PanelId.LocalEnvPackage, PanelId.LocalEnvFronts, PanelId.LocalEnvBacks].includes(selected)){
                return new LocalView(this.localState)
            }
            if ([PanelId.AssetsUploadPackages].includes(selected)){
                return new AssetsView(this.assetsState)
            }
            if ([PanelId.ConfigurationGeneral, PanelId.ConfigurationRawFile].includes(selected)){
                return new ConfigurationView(this.configurationState)
            }
        })
    )

    constructor(){

    }

    addTabUpload( name: string ) {
        let actualTabs = this.uploadChildren$.getValue()
        tabsDisplayInfo[ PanelId.AssetsUploadPackage] = { title: name, enabled: true}
        this.uploadChildren$.next([...actualTabs, PanelId.AssetsUploadPackage])
    }
}