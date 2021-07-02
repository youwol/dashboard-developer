import { attr$, VirtualDOM } from "@youwol/flux-view"
import { ExpandableGroup } from "@youwol/fv-group"
import { ComponentsUpdate, ComponentUpdateStatus } from "../backend/environment.router"
import { descriptionView } from "../utils-view"
import { GeneralState } from "./general.view"


class State extends ExpandableGroup.State {

    static isExpanded(availableUpdates : ComponentsUpdate) {

        if(availableUpdates.status==ComponentUpdateStatus.PENDING)
            return false
        let upToDate = availableUpdates.components.reduce( (acc, e) => {
            return acc && e.latestVersion == e.localVersion
        }, true)
        return !upToDate
    }

    constructor(public readonly availableUpdates : ComponentsUpdate
        ) {
        super("YouWol updates",State.isExpanded(availableUpdates))
    }
}

function headerView(state: State): VirtualDOM {

    let icons = {
        [ComponentUpdateStatus.PENDING]: { class:"fas fa-spinner fa-spin"},
        [ComponentUpdateStatus.OUTDATED]:{ class:"fas fa-exclamation fv-text-focus"},
        [ComponentUpdateStatus.SYNC]:  { class:"fas fa-check fv-text-success"}      
    }
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
            icons[state.availableUpdates.status],
            {
                innerText: state.name,
                class: 'px-2',
                style: { 'font-size': 'large' }
            }
        ]
    }
}

export function availableUpdatesView(state: GeneralState, updates: ComponentsUpdate) {
    
    let table = {
        tag: 'table', class:'fv-color-primary  w-100 text-center',
        children:[
            {   tag:'thead',
                children:[
                    {   tag: 'tr', class:'fv-bg-background-alt',
                        children: [
                            { tag: 'td', innerText:'Name'},
                            { tag: 'td', innerText:'Local version'},
                            { tag: 'td', innerText:'Latest version'},
                            { tag: 'td', innerText:''}
                        ] 
                    }
                ]
            },
            {   tag:'tbody',
                children: updates.components
                .map( component => {
                    return {
                        tag: 'tr',
                        class:'fv-hover-bg-background-alt',
                        children: [
                            { tag: 'td', innerText:component.name},
                            { tag: 'td', innerText:component.localVersion},
                            { tag: 'td', innerText:component.latestVersion},
                            { tag: 'td', 
                              children: [
                                ( component.localVersion == component.latestVersion )
                                    ? {}
                                    : { 
                                        class:'fas fa-sync fv-text-focus fv-pointer',
                                        onclick: () => {
                                            state.syncComponent(component)
                                        }    
                                    }
                              ]}
                        ]
                    }
                })
            }
        ]
    }

    let contentView = (state: State) => ({
        class: "border rounded fv-color-primary p-2",
        children: [
            descriptionView({
                innerText: `The updates available.`
            }),
            updates.status == ComponentUpdateStatus.PENDING
                ? { class : 'fas fa-spinner fa-spin' }
                : table
        ]
    })
    return new ExpandableGroup.View(
        {
            state: new State(updates),
            headerView,
            contentView,
            className: 'my-2'
        } as any
    )
}

