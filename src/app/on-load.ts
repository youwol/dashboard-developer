import { child$, render } from '@youwol/flux-view'
import { SideBarView } from "./sidebar-view";
import { filter, take } from 'rxjs/operators';
import { Backend } from './backend/router';
import { plugSystemErrors } from './system-errors.view';
import { AppState } from './app-state';

require('./style.css');

let appState = new AppState()

let sideBar = new SideBarView(appState)



let vDOM = {
    class: 'd-flex fv-text-primary h-100',
    children: [
        sideBar,
        child$( 
            appState.panelViewFactory$,
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
    document.body.appendChild(render(vDOM))
})

