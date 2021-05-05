import { attr$, child$, VirtualDOM } from "@youwol/flux-view";
import { ExpandableGroup } from "@youwol/fv-group";
import { Select } from "@youwol/fv-input";
import { BehaviorSubject, Observable } from "rxjs";
import { distinctUntilChanged, map, mergeMap, skip } from "rxjs/operators";
import { Backend } from "../backend/router";
import { descriptionView } from "../utils-view";
import { Environment, RemoteGatewayInfo } from "./models";



class State extends ExpandableGroup.State {

    constructor(public readonly gatewayInfo : RemoteGatewayInfo
        ) {
        super("Remote info")
    }
}

function headerView(state: State): VirtualDOM {

    return {
        className: ExpandableGroup.defaultHeaderClass,
        children: [
            {
                tag: 'i',
                className: attr$(
                    state.expanded$,
                    d => d ? "fa-caret-down" : "fa-caret-right",
                    { wrapper: (d) => "px-2 fas " + d }
                )
            },
            {
                tag: 'i',
                class: 'fas fa-wifi ' + (state.gatewayInfo.connected ? "fv-text-success" :"fv-text-error")
            },
            {
                innerText: "Remote info",
                class: 'px-2',
                style: { 'font-size': 'large' }
            },
            {
                class: 'fv-text-focus px-2',
                children: [
                    {
                        innerText:  state.gatewayInfo.name
                    }
                ]
            }
        ]
    }
}

export function remoteGatewayInfoView(environment: Environment) {

    let items = environment.remotesInfo.map( ({host}) => new Select.ItemData(host, host)) 

    let selected$ = new BehaviorSubject(environment.remoteGatewayInfo.host)    
    
    let selectState = new Select.State(items, selected$ )
    selectState.selectionId$.pipe(
        skip(1),
        distinctUntilChanged(),
        mergeMap( (name) => {
            return Backend.environment.selectRemoteGateway$({name}) 
        })
    ).subscribe(() => {})


    let contentView = (state: State) => ({
        class: "border rounded fv-color-primary p-2",
        children: [
            descriptionView({
                innerText: `The remote environment with which you want to synchronize your work.`
            }),
            {
                class: 'd-flex align-items-center',
                children: [
                    { innerText: 'Current environment:' },
                    new Select.View({ state: selectState, class: 'mx-2' } as any)
                ]
            },
            {   tag:'ul',
                innerText: 'Info',
                children:[
                    {   tag:'li',
                        innerText:"name: "+environment.remoteGatewayInfo.name
                    },
                    {   tag:'li',
                        innerText:"host: "+environment.remoteGatewayInfo.host
                    },
                    {   tag:'li',
                        innerText:"connected: "+environment.remoteGatewayInfo.connected
                    },
                    
                ]
            }
        ]
    })
    return new ExpandableGroup.View(
        {
            state: new State(environment.remoteGatewayInfo),
            headerView,
            contentView,
            className: 'my-2'
        } as any
    )
}
