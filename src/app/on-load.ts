import { child$, render } from '@youwol/flux-view'
import { LocalState, LocalView } from "./local/local-view";
import { PanelId, SideBarView } from "./sidebar-view";
import { AssetsState, AssetsView } from "./assets/assets-view";
import { filter, map, take } from 'rxjs/operators';
import { ConfigurationState, ConfigurationView } from './environment/environment.view';
import { Backend } from './backend';
import { plugSystemErrors } from './system-errors.view';

require('./style.css');


let sideBar = new SideBarView()

let localState = new LocalState(sideBar.selected$)
let assetsState = new AssetsState(sideBar.selected$)
let configurationState = new ConfigurationState(sideBar.selected$)

let panelViewFactory$ = sideBar.selected$.pipe(
    map( selected => {

        if ([PanelId.LocalEnvPackage, PanelId.LocalEnvFronts, PanelId.LocalEnvBacks].includes(selected)){
            return new LocalView(localState)
        }
        if ([PanelId.AssetsUploadPackages].includes(selected)){
            return new AssetsView(assetsState)
        }
        if ([PanelId.ConfigurationGeneral, PanelId.ConfigurationRawFile].includes(selected)){
            return new ConfigurationView(configurationState)
        }
    })
)

let vDOM = {
    class: 'd-flex fv-text-primary h-100',
    children: [
        sideBar,
        child$( 
            panelViewFactory$,
            (selected) => selected
        )
    ]
}

let adminWS = Backend.system.connectWs()

let systemErrors$ = adminWS.pipe(
    filter(message => message.type=="SystemError")
)

plugSystemErrors( systemErrors$ )

adminWS.pipe(take(1)).subscribe( message => {
    console.log("Go!")
    document.body.appendChild(render(vDOM))
})

