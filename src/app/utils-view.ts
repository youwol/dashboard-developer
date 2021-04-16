import { attr$, child$, VirtualDOM } from "@youwol/flux-view"
import { Button } from "@youwol/fv-button"
import { BehaviorSubject } from "rxjs"


export let innerTabClasses= 'p-2 fv-text-primary h-100 d-flex flex-column h-100'

export function button(icon: string, text: string){

    let button = new Button.View({
        contentView: () => ({
            children:[
                {tag:'i', class:icon},
                {tag:'span', class:'px-2', innerText: text},
            ]
        }), 
        class: 'fv-btn fv-btn-secondary mx-2'
    } as any)
    
    return button
}


export function descriptionView( content: VirtualDOM, expanded:boolean = false) {
    let toggled$ = new BehaviorSubject(expanded)
    return {
        class: 'd-flex align-items-top fv-bg-background-alt border rounded ', style: {'font-style':'oblique', width:'fit-content'},
        children:[
            { 
                tag:'i', 
                class: attr$(
                    toggled$,
                    (toggled) => toggled ? 'fv-hover-text-primary fv-text-focus':'fv-hover-text-focus fv-text-primary ',
                    {wrapper: (d) => d + ' fas py-2 px-3 fa-info fv-pointer fv-hover-text-focus '}
                ),
                onclick:(ev) => {
                    toggled$.next(!toggled$.getValue());
                    ev.stopPropagation() }
            },
            {
                class:attr$(
                    toggled$,
                    (toggled) => toggled ? 'py-3 pl-1 pr-3':''
                ),
                children:[
                    child$(
                        toggled$,
                        (toggled) => toggled ? content : {}
                    )
                ]
            }
        ]
    }
}
