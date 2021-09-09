import { child$, children$, render, VirtualDOM } from "@youwol/flux-view"
import { Modal } from "@youwol/fv-group"
import { BehaviorSubject, Subject } from "rxjs"
import { mergeMap } from "rxjs/operators"
import { Backend } from "../backend/router"
import { filesBrowserView } from "../shared-views/files-browser.view"
import { GeneralState } from "./general.view"
import { Environment } from "./models"

class ModalState extends Modal.State{

    public readonly startingFolder

    constructor(public readonly environment: Environment){
        super()
        this.startingFolder = environment.configurationPath.slice(0,-1)
    }
}


export function popupFilesBrowserView(environment: Environment) {

    console.log(environment)
    let state = new ModalState(environment)
    let view = new Modal.View({ state, contentView } as any)
    let modalDiv = render(view)
    document.querySelector("body").appendChild(modalDiv)

    state.ok$.subscribe(() => modalDiv.remove())
    state.cancel$.subscribe(() => modalDiv.remove())
}

function contentView(state: ModalState){

    return filesBrowserView({
        startingFolder: state.startingFolder,
        originFolderIndex:0,
        configFileView: (folderSelected$, name,) => configView(folderSelected$, name, state.environment.configurationPath, state.ok$),
        style:{"width":"50vw", "height":"50vh", overflow:'auto'}
    })
}


function configView(folderSelected$: BehaviorSubject<Array<string>>, name:string,  currentConf: Array<string>, ok$: Subject<MouseEvent>): VirtualDOM{

    let currentFolder = folderSelected$.getValue()
    return { 
        class:'fv-pointer d-flex  align-items-center fv-hover-bg-background-alt fv-text-focus', 
        style: { 'font-weight': JSON.stringify(currentFolder.concat(name)) === JSON.stringify(currentConf) ? 'bolder': 'inherit'},
        children: [
            { class: 'fas fa-file px-2'},
            { innerText: name }
        ],
        onclick: (ev) =>  {
            ok$.next(ev)
            GeneralState.switchConfiguration([...folderSelected$.getValue(), name] ) 
        }
    }
}
