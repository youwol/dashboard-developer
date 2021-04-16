import { child$, VirtualDOM } from "@youwol/flux-view"
import { Backend } from "../backend"
import { LogsState, LogsView } from "../logs-view"
import { descriptionView, innerTabClasses } from "../utils-view"
import { GeneralState } from "./general.view"


export class RawfileView implements VirtualDOM {

    public readonly tag = 'div'
    public readonly children: Array<VirtualDOM>
    public readonly class = innerTabClasses
    
    connectedCallback: (elem) => void

    constructor() {

        let logsState = new LogsState(
            GeneralState.webSocket$
        )
       
        this.children = [
            {
                class: 'd-flex flex-column flex-grow-1 w-100 overflow-auto', style:{height:"0"},
                children: [
                    descriptionView({innerHTML:`This is a readonly preview of your current configuration file.
You can get arguments completion, type checkings, and more when editing this file with <a href='https://www.jetbrains.com/fr-fr/pycharm/'>pycharm</a> and the plugin <a href='https://pydantic-docs.helpmanual.io/pycharm_plugin/'> pydantic </a>.`}),
                    child$( 
                        Backend.environment.fileContent$(),
                        ({content}) => {
                            return {
                                id:"codeMirror", class:"flex-grow-1 w-100 py-1", style:{height:"0"},
                                connectedCallback: (elem) => {     
                                    let div =  document.getElementById("codeMirror")
                                    let config = {
                                        value: content,
                                        mode:  "python",
                                        theme: "blackboard",
                                        lineNumbers: true
                                    }
                                    let cm = window['CodeMirror'](div,config)
                                    cm.setSize("100%","100%")
                                }
                            }
                        }
                    )
                ]
            },
            new LogsView(logsState)
        ]

        this.connectedCallback = (elem) => {
            elem.subscriptions.push(
                //Backend.modules.status$().subscribe( s => this.state.status$.next(s)) 
            )
        }
    }
}

