import { attr$, child$, VirtualDOM } from "@youwol/flux-view";
import { ExpandableGroup } from "@youwol/fv-group";
import { Select } from "@youwol/fv-input";
import { Observable } from "rxjs";
import { filter, mergeMap } from "rxjs/operators";
import { Backend } from "../backend/router";
import { descriptionView } from "../utils-view";
import { Environment, FormalParameter } from "./models";


class State extends ExpandableGroup.State {

    constructor(public readonly environment : Environment
        ) {
        super("User info")
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
                class: 'fas fa-cog'
            },
            {
                innerText: "Configuration parameters",
                class: 'px-2',
                style: { 'font-size': 'large' }
            }
        ]
    }
}

export function configParamsView(environment: Environment) {

    let contentView = (state: State) => ({
        class: "border rounded fv-color-primary p-2",
        children: [
            descriptionView({
                innerText: `These parameters are those declared in your configuration file. They can control behaviors of the different pipelines.
                Refer to the configuration file for more information on the meaning of these parameters.
                `
            }),
            parametersView(environment.configurationParameters.parameters)
        ]
    })
    return new ExpandableGroup.View(
        {
            state: new State(environment),
            headerView,
            contentView,
            className: 'my-2'
        } as any
    )
}

function parametersView(params: {[key:string]:FormalParameter}): VirtualDOM{

    return {
        class:"my-2",
        children: Object.entries(params).map( ([id,param]) => {
            let content = {}
            let value$ = undefined
            if(param.meta.type == 'ENUM')
                content =enumParameterView(id, param)

            
            return {
                class:'border rounded p-2',
                children: [
                    {
                        class: 'd-flex align-items-center',
                        children:[
                            {
                                class:'px-2 fv-text-focus',
                                innerText: param.name+ ":"
                            },
                            content
                        ]
                    },
                    {   class: 'd-flex align-items-center',
                        children:[
                            {
                                tag: 'i',
                                class: 'fas fa-info-circle px-3'
                            },
                            {   
                                innerText: param.description
                            }
                        ]
                    }
                ]
                
            }
        })
    }
}

function enumParameterView(id: string, param: FormalParameter ): VirtualDOM{
    
    let items = param.meta.values.map( v => new Select.ItemData(v,v))
    let state = new Select.State(items, param.value )
    state.selectionId$.pipe(
        filter( value => value != param.value),
        mergeMap( value => {
            return Backend.environment.postConfigParameters$({ values:{[id]:value}})       
        })
    )
    .subscribe( () => {
    })
    return new Select.View({state})
}
