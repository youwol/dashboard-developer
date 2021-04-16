import { attr$, child$, VirtualDOM } from "@youwol/flux-view"
import { Observable } from "rxjs"
import { filter, mergeMap } from "rxjs/operators"
import { button, descriptionView } from "../utils-view"
import { Action, ActionStep, BackEndStatus } from "./utils"


export function installQueueView(
    webSocket$: Observable<any>,
    assets: Array<BackEndStatus>,
    descriptionText: string,
    backend: {install$:(assetId: string)=>Observable<any>}
) : VirtualDOM {

    if(assets.filter(status => status.installStatus == "NOT_INSTALLED").length==0)
        return {}

    return {
        class: 'overflow-auto',
        children: [
            {
                tag: 'h4',
                innerText: 'Assets to install'
            },
            descriptionView({
                innerText: descriptionText
            }),
            {
                tag: 'table', class: 'fv-color-primary mx-auto text-center my-2',
                style: { 'max-height': '100%' },
                children: [
                    {
                        tag: 'thead',
                        children: [
                            {
                                tag: 'tr', class: 'fv-bg-background-alt',
                                children: [
                                    { tag: 'td', innerText: 'Name' },
                                    { tag: 'td', innerText: '' }
                                ]
                            }
                        ]
                    },
                    {
                        tag: 'tbody',
                        children: assets
                            .filter(status => status.installStatus == "NOT_INSTALLED")
                            .map((status) => {
                                return {
                                    tag: 'tr',
                                    children: [
                                        { 
                                            tag: 'td', 
                                            innerText: status.name, 
                                            style: { 'font-family': 'cursive', 'font-size': 'large' } 
                                        },
                                        installCell(webSocket$, status, backend)
                                    ]
                                }
                            })
                    }
                ]

            }
        ]
    }

}

function installCell(
    webSocket$: Observable<any>, 
    asset: BackEndStatus,
    backend: {install$:(assetId: string)=>Observable<any>}
    ) {

    let target$ = webSocket$.pipe(
        filter((message) => {
            return message.target == asset.name && message.action == Action.INSTALL 
        })
    )

    let btn = button('', 'Install')
    btn.state.click$.pipe(
        mergeMap( () => {
            return backend.install$(asset.assetId)
        })
    ).subscribe(
        () => console.log("install done")
    )
    return { 
        class:'d-flex align-items-center',
        children:[ 
            child$( 
                btn.state.click$,
                () => ({}),
                {untilFirst: btn as any}
                ),
            {
                tag: 'i',
                class: attr$(
                    target$.pipe(
                        filter(({ step }) => [ActionStep.STARTED, ActionStep.DONE].includes(step))
                    ),
                    (d) =>{
                        return d.step == ActionStep.STARTED ? 'fas fa-spinner fa-spin p-3' : '' 
                    }
                )
            }
        ]
    }
}
