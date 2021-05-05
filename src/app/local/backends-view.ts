import { Backend } from "../backend/router";
import { BehaviorSubject, combineLatest, ReplaySubject, Subscription } from "rxjs";
import { VirtualDOM, child$, HTMLElement$ } from '@youwol/flux-view'
import { filter, map, mergeMap, take } from "rxjs/operators";
import { button, innerTabClasses } from "../utils-view";
import { LogsState, LogsView } from "../logs-view";
import {Select} from '@youwol/fv-input'
import { newSkeletonModalView, SkeletonResponse } from "./skeletons-modal.view";
import { installQueueView } from "./utils.view";
import { BackEndStatus } from "./utils";
import { GeneralState } from "../environment/general.view";


export class BackendsState{

    status$ = new ReplaySubject<Array<BackEndStatus>>(1) 
    webSocket$ : ReplaySubject<any>

    environments$ = new BehaviorSubject<Array<Select.ItemData>>([])
    currentEnvironment$ = new BehaviorSubject<any>("")
    selectedEnvId$ = new BehaviorSubject<string>("")

    envSelectionState = new Select.State(this.environments$, this.selectedEnvId$)

    selectedUserId$ = new BehaviorSubject<string>( localStorage.getItem("user-name") || 'greinisch@youwol.com' )


    constructor(){
        this.webSocket$ = Backend.backs.connectWs() 
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
               return Backend.backs.status$()
            })
        )
        .subscribe(s => {
            this.status$.next(s.status)
        })
        return [s0, s1]
    }
}

export class BackendsView implements VirtualDOM{

    public readonly tag = 'div'
    public readonly children : Array<VirtualDOM> 
    public readonly class = innerTabClasses
    public readonly state : BackendsState

    connectedCallback: (elem) => void

    constructor( state : BackendsState ){
        
        this.state = state

        let logsState = new LogsState(this.state.webSocket$)

        this.children = [
            {   tag:'h3', class:'d-flex',
                children:[
                this.newBackBttn(),
                child$(
                    state.status$, 
                    () => ({ children: [
                        this.startBttn(),
                        this.restartBttn()
                    ] } as VirtualDOM),
                    { untilFirst: { class: 'px-2 fas fa-spinner fa-spin'} }
                )
            ]},
            child$( 
                state.status$, 
                (data) => installQueueView(this.state.webSocket$, data, "", Backend.backs)
            ),
            child$( 
                state.status$, 
                (data) => this.contentView(data)
            ),
            new LogsView(logsState)
        ]
        this.connectedCallback = (elem: HTMLElement$) => {
            elem.ownSubscriptions(...this.state.subscribe())
        }
    }

    newBackBttn() : VirtualDOM  {

        let btn = button('fas fa-plus', 'new backend-end')
        btn.state.click$.pipe(
            mergeMap(() => Backend.backs.skeletons$())
        ).subscribe(({ skeletons }: { skeletons: Array<SkeletonResponse> }) => {
            newSkeletonModalView("New backend", skeletons, Backend.backs)
        })
        
        return btn
    }

    startBttn() : VirtualDOM  {

        let btn = button('fas fa-play', 'Start')
        
        btn.state.click$.pipe(
            mergeMap( () => Backend.backs.start$())
        ).subscribe( () => {})
        return btn
    }

    restartBttn() : VirtualDOM  {

        let btn = button('fas fa-play', 'Re-start')
        
        btn.state.click$.pipe(
            mergeMap( () => Backend.backs.restart$())
        ).subscribe( () => {})
        return btn
    }

    contentView(tableData ) : VirtualDOM { 

        return {
            class:'flex-grow-1 h-25 overflow-auto',
            children:[
                this.tableView( tableData )
            ]
        }
    }


    tableView( tableData: Array<BackEndStatus> ) : VirtualDOM {

        return {
            tag: 'table', class:'fv-color-primary  w-100 text-center',
            children:[
                {   tag:'thead',
                    children:[
                        {   tag: 'tr', class:'fv-bg-background-alt',
                            children: [
                                { tag: 'td', innerText:'Name'},
                                { tag: 'td', innerText:''},
                                { tag: 'td', innerText:'Actions'},
                                { tag: 'td', innerText:'Health'}
                            ] 
                        }
                    ]
                },
                {   tag:'tbody',
                    children:tableData
                    .filter( status => status.installStatus == "INSTALLED")
                    .map( status => {
                        return {
                            tag: 'tr',
                            class:'fv-hover-bg-background-alt',
                            children: [
                                nameCell(this.state, status),
                                docCell(this.state, status),
                                actionsCell(this.state, status),
                                healthCell(this.state, status)
                            ]
                        }
                    })
                }
            ]
        }
    }
}

let baseClassAction = "fv-pointer p-2 fv-hover-bg-primary fv-hover-text-focus"


function nameCell(state: BackendsState, status: BackEndStatus) {
    return { tag: 'td', innerText: status.name , style : {'font-family': 'cursive', 'font-size': 'large'}}
}

function docCell(state: BackendsState, status: BackEndStatus) {
    if(status.openApi)
        return { tag: 'td', innerHTML: `<a href='${status.openApi}'> doc </a> ` }
    return { tag: 'td'}
}

function baseCell(state: BackendsState, initial: BackEndStatus, data ) {

    let target$ = state.webSocket$.pipe(
        filter( (message) => message.target == initial.name && message.action == "serve" ),
        filter( (message) => ['started', 'serving', 'done'].includes(message.step)) 
    )
    
    let status$ = new BehaviorSubject<string>(
        initial.health ? data['serving'] : data['error']
    )

    return { 
        tag: 'td', 
        children:[
            child$(status$,
                (d) => ({
                    tag:'i',
                    class:  d.class ,
                    onclick: d.onclick ? d.onclick : () => {}
                })
            )
        ],
        connectedCallback: (elem) => {
            elem.subscriptions.push(
                target$.pipe(
                    map( message => data[message.step] )
                ).subscribe ( d => status$.next(d))
            )
        } } 
}

function healthCell(state: BackendsState, initial: BackEndStatus) {

    let data = {
        'started': {
            class: 'fas fa-spinner fa-spin fv-text-primary',
            onclick: undefined
        },
        'serving': {
            class: 'fv-text-success fas fa-check px-2',
            onclick: undefined
        },
        'error': {
            class: 'fv-text-error fas fa-times px-2',
            onclick: undefined
        },
        'done': {
            class: 'fv-text-error fas fa-times px-2',
            onclick: undefined
        }
    }

    return baseCell( state, initial, data)
}

function actionsCell(state: BackendsState, status: BackEndStatus) {

    return { 
        tag: 'td', 
        children:[
            {
                tag:'i',
                class:  status.devServer 
                ? `fas fa-stop fv-text-primary ${baseClassAction}` 
                : `fas fa-play fv-text-primary ${baseClassAction}`,
                onclick: () => {
                    status.devServer 
                    ? Backend.backs.stop$(status.assetId).subscribe()
                    : Backend.backs.start$(status.assetId).subscribe()
                }
            }
        ]
    } 
/*
    let data = {
        'started': {
            class: ``,
            onclick: undefined
        },
        'serving': {
            class: `fas fa-stop fv-text-primary ${baseClassAction}`,
            onclick: () => Backend.backs.stop$(initial.name).subscribe()
        },
        'error': {
            class: `fas fa-play fv-text-primary ${baseClassAction}`,
            onclick: () =>  Backend.backs.start$(initial.name).subscribe()
        },
        'done': {
            class: `fas fa-play fv-text-primary ${baseClassAction}`,
            onclick: () =>  Backend.backs.start$(initial.name).subscribe()
        }
    }

    return baseCell( state, initial, data)*/
}



function deployedCell(state: BackendsState, initial) {
    return {}
}
