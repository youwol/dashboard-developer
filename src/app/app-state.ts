import { BehaviorSubject } from "rxjs"
import { map } from "rxjs/operators"
import { AssetsDownloadState, AssetsDownloadView } from "./assets-download/assets-download.view"
import { AssetsUploadState, AssetsUploadView } from "./assets-upload/assets-upload.view"
import { ConfigurationState, ConfigurationView } from "./environment/environment.view"
import { LocalState, LocalView } from "./local/local-view"
import { PanelId, tabsDisplayInfo } from "./panels-info"

export class AppState {

    public readonly environmentChildren$ = new BehaviorSubject([
        PanelId.ConfigurationGeneral,
        PanelId.ConfigurationRawFile
    ])
    public readonly localChildren$ = new BehaviorSubject([
        PanelId.LocalEnvPackage,
        PanelId.LocalEnvFronts,
        PanelId.LocalEnvBacks,
        PanelId.LocalEnvCDN
    ])
    public readonly uploadChildren$ = new BehaviorSubject([
        PanelId.AssetsUploadPackages,
        PanelId.AssetsUploadFluxApps,
        PanelId.AssetsUploadData,
        PanelId.AssetsUploadStories
    ])
    public readonly downloadChildren$ = new BehaviorSubject([
        PanelId.AssetsDownloadPackages,
        PanelId.AssetsDownloadFluxApps
    ])


    public readonly selected$ = new BehaviorSubject<PanelId>(PanelId.ConfigurationGeneral)

    localState = new LocalState(this.selected$)
    assetsUploadState = new AssetsUploadState(this.selected$)
    assetsDownloadState = new AssetsDownloadState(this.selected$)
    configurationState = new ConfigurationState(this.selected$)

    panelViewFactory$ = this.selected$.pipe(
        map(selected => {

            if ([PanelId.LocalEnvPackage, PanelId.LocalEnvFronts, PanelId.LocalEnvBacks, PanelId.LocalEnvCDN].includes(selected)) {
                return new LocalView(this.localState)
            }
            if ([PanelId.AssetsUploadPackages, PanelId.AssetsUploadFluxApps, PanelId.AssetsUploadData, PanelId.AssetsUploadStories].includes(selected)) {
                return new AssetsUploadView(this.assetsUploadState)
            }
            if ([PanelId.ConfigurationGeneral, PanelId.ConfigurationRawFile].includes(selected)) {
                return new ConfigurationView(this.configurationState)
            }
            if ([PanelId.AssetsDownloadPackages, PanelId.AssetsDownloadFluxApps].includes(selected)) {
                return new AssetsDownloadView(this.assetsDownloadState)
            }
        })
    )

    constructor() {

    }

    addTabUpload(name: string) {
        let actualTabs = this.uploadChildren$.getValue()
        tabsDisplayInfo[PanelId.AssetsUploadPackage] = { title: name, enabled: true }
        this.uploadChildren$.next([...actualTabs, PanelId.AssetsUploadPackage])
    }
}
