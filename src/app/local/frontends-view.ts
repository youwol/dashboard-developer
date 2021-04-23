import { Backend } from "../backend";
import { combineLatest, ReplaySubject } from "rxjs";
import { VirtualDOM, child$, HTMLElement$, } from '@youwol/flux-view'
import { filter, mergeMap, take } from "rxjs/operators";
import { button, innerTabClasses } from "../utils-view";
import { LogsState, LogsView } from "../logs-view";
import { Action, ActionStep, FrontEndStatus } from "./utils";
import { newSkeletonModalView, SkeletonResponse } from "./skeletons-modal.view";
import { GeneralState } from "../environment/general.view";


export class FrontendsState{

    status$ = new ReplaySubject<Array<FrontEndStatus>>(1) 

    webSocket$ : ReplaySubject<any>

    constructor(){
        this.webSocket$ = Backend.fronts.connectWs()        
    }

    subscribe(){
        let s0 = this.webSocket$.pipe(
            filter( ({type}) => type=="Status")
            )
        .subscribe( ({status}) =>{
            this.status$.next(status)
        })
        let s1 = combineLatest([
            this.webSocket$.pipe(take(1)),
            GeneralState.configurationUpdated$
        ]).pipe(
            mergeMap(() => {
               return Backend.fronts.status$()
            })
        )
        .subscribe(s => {
            this.status$.next(s.status)
        })   
        return [s0, s1]
    }
}

export class FrontendsView implements VirtualDOM{

    public readonly tag = 'div'
    public readonly children : Array<VirtualDOM> 
    public readonly class = innerTabClasses
    public readonly state : FrontendsState

    connectedCallback: (elem) => void

    constructor( state : FrontendsState ){
        
        this.state = state
        let logsState = new LogsState(this.state.webSocket$)
        
        this.children = [
            {   tag:'h3', class:'d-flex', 
                children:[
                child$(
                    state.status$, 
                    () => ({ children: [this.newFrontBttn()] } as VirtualDOM),
                    { untilFirst: { class: 'px-2 fas fa-spinner fa-spin'} }
                )
            ]},
            child$( 
                state.status$, 
                (status) => this.contentView(status)),
            new LogsView(logsState)
        ]
        this.connectedCallback = (elem: HTMLElement$) => {
            elem.ownSubscriptions(...this.state.subscribe())
        }
    }


    newFrontBttn() : VirtualDOM  {

        let btn = button('fas fa-plus', 'new front-end')
        btn.state.click$.pipe(
            mergeMap(() => Backend.fronts.skeletons$())
        ).subscribe(({ skeletons }: { skeletons: Array<SkeletonResponse> }) => {
            newSkeletonModalView("New frontend", skeletons, Backend.fronts)
        })
        
        
        return btn
    }


    contentView(tableData: Array<FrontEndStatus> ) : VirtualDOM { 

        return {
            class:'flex-grow-1 h-25 overflow-auto',
            children:[
                this.tableView( tableData )
            ]
        }
    }


    tableView( tableData: Array<FrontEndStatus>) : VirtualDOM {

        return {
            tag: 'table', class:'fv-color-primary  w-100 text-center',
            children:[
                {   tag:'thead',
                    children:[
                        {   tag: 'tr', class:'fv-bg-background-alt',
                            children: [
                                { tag: 'td', innerText:'Name'},
                                { tag: 'td', innerText:'url'},
                                { tag: 'td', innerText:'Dev server'},
                                { tag: 'td', innerText:'Health'}
                            ] 
                        }
                    ]
                },
                {   tag:'tbody',
                    children:tableData.map( (d: FrontEndStatus) => {
                        return {
                            tag: 'tr',
                            class:'fv-hover-bg-background-alt',
                            children: [
                                nameCell(d),
                                urlCell(d),
                                devServerCell(this.state, d),
                                healthCell(d)
                            ]
                        }
                    })
                }
            ]
        }
    }
}

let baseClassAction = "fv-pointer p-2 fv-hover-bg-primary fv-hover-text-focus" 


function nameCell( status: FrontEndStatus) {
    return { tag: 'td', innerText: status.name , style : {'font-family': 'cursive', 'font-size': 'large'}}
}


function urlCell(status: FrontEndStatus) {
    return { 
        tag: 'td', 
        children:[
            {
                tag:'a',
                href:status.url,
                innerText: status.url
            }
        ]
    }
}

function healthCell(status: FrontEndStatus) {
    return { 
        tag: 'td', 
        class: status ? 'fv-text-success': 'fv-text-error',
        children:[
            {   tag: 'i', 
                class: status ? 'fas fa-check px-2': 'fas fa-times px-2',
                onclick
             }
        ] } 
}

function devServerCell(state: FrontendsState, status: FrontEndStatus) {

    if(status.devServer==null)
        return {}

    let target$ = state.webSocket$.pipe(
        filter( (message) =>  message.target == status.name && message.action == Action.SERVE ),
        filter( ({step}) => [ActionStep.STARTED, ActionStep.DONE ].includes(step)),
    )
    let status$ = new ReplaySubject()
    target$.subscribe( message => {
        status$.next(message) 
    })
    status$.next( status.devServer ? { step:ActionStep.STARTED} : {step:ActionStep.DONE})
    let action = {   
        children:[
            child$(
                status$,
                ({step}) => ({
                    tag : 'i',
                    class: baseClassAction + (step == ActionStep.STARTED ? " fas fa-stop " : " fas fa-play "),
                    onclick: () => step == ActionStep.STARTED
                        ? Backend.fronts.stop$(status.name).subscribe( () => {})
                        : Backend.fronts.start$(status.name).subscribe( () => {})  
                })
            ) 
        ]
    }
    
    return { tag: 'td', children:[action] }
}


