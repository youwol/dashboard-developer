import { Backend } from "../backend";
import { BehaviorSubject, combineLatest, ReplaySubject, Subject } from "rxjs";
import { VirtualDOM, child$, attr$ } from '@youwol/flux-view'
import { debounceTime, filter, map, mergeMap, switchMap, take } from "rxjs/operators";
import { button, descriptionView, innerTabClasses } from "../utils-view";
import { LogsState, LogsView } from "../logs-view";
import { Action, ActionScope, ActionStep, Dependencies, Status } from "./utils";
import { GeneralState } from "../environment/general.view";

import { newSkeletonModalView, SkeletonResponse } from "./skeletons-modal.view";

export class ModulesState {

    static status$ = new ReplaySubject<any>(1)
    highlighted$ = new ReplaySubject<Array<string>>(1)

    webSocket$: ReplaySubject<any>

    autoWatched$ = new BehaviorSubject<Array<string>>([])
    dependenciesRequest$ = new Subject<{assetId:string, direction:string}>()
    constructor() {
        this.webSocket$ = Backend.modules.connectWs()
        combineLatest([
            this.webSocket$.pipe(take(1)),
            GeneralState.configurationUpdated$
        ]).pipe(
            mergeMap(() => {
               return Backend.modules.status$()
            })
        )
        .subscribe(s => {
            ModulesState.status$.next(s)
        })
        this.dependenciesRequest$.pipe(
            debounceTime(250),
            switchMap( ({assetId, direction}) => {
                return Backend.modules.dependencies$(assetId).pipe( map( deps => ({deps, direction})))
                }
            )
        ).subscribe(( {deps, direction} : {deps:Dependencies, direction:string}) => { 
            direction == 'up' 
            ? this.highlighted$.next(deps.belowDependencies) 
            : this.highlighted$.next(deps.aboveDependencies) 
        })
    }

    toggleWatch(libraryId) {

        let watcheds = this.autoWatched$.getValue()
        watcheds = watcheds.includes(libraryId)
            ? watcheds.filter(w => w != libraryId)
            : watcheds.concat([libraryId])
        this.autoWatched$.next(watcheds)
        Backend.modules.watch$({ libraries: watcheds }).subscribe()
    }
}

export class ModulesView implements VirtualDOM {

    public readonly tag = 'div'
    public readonly children: Array<VirtualDOM>
    public readonly class = innerTabClasses
    public readonly state: ModulesState
    connectedCallback: (elem) => void

    constructor(state: ModulesState) {

        this.state = state

        let logsState = new LogsState(this.state.webSocket$.pipe(
            map((message) => message)
        ))

        this.children = [
            {
                tag: 'h3', class: 'd-flex',
                children: [
                    child$(
                        ModulesState.status$,
                        () => ({ children: [this.syncAllBttn(), this.newPackageBttn()] } as VirtualDOM),
                        { untilFirst: { class: 'px-2 fas fa-spinner fa-spin' } }
                    )
                ]
            },
            child$(
                ModulesState.status$.pipe(map(resp => resp.status)),
                (data) => this.contentView(data)),
            new LogsView(logsState)
        ]
        this.connectedCallback = (elem) => {
            elem.subscriptions.push(
                //Backend.modules.status$().subscribe( s => this.state.status$.next(s)) 
            )
        }
    }

    syncAllBttn(): VirtualDOM {

        let btn = button('fas fa-sync', 'Sync. all')
        btn.state.click$.pipe(
            mergeMap(() => Backend.modules.action$({ action: 'SYNC', targetName: '', scope: 'ALL' }))
        ).subscribe((d) => {
            ModulesState.status$.next(d)
        })
        return btn
    }

    newPackageBttn(): VirtualDOM {

        let btn = button('fas fa-plus', 'new package')
        btn.state.click$.pipe(
            mergeMap(() => Backend.modules.skeletons$())
        ).subscribe(({ skeletons }: { skeletons: Array<SkeletonResponse> }) => {
            newSkeletonModalView("New package", skeletons, Backend.modules)
        })
        return btn
    }

    contentView(allStatus: Array<Status>): VirtualDOM {

        return {
            class: 'flex-grow-1 h-25 overflow-auto',
            children: [
                this.installQueueView(allStatus),
                this.pipelinesTableView(allStatus)
            ]
        }
    }

    installQueueView(allStatus: Array<Status>) {

        if(allStatus.filter(status => status.installStatus == "NOT_INSTALLED").length==0)
            return {}

        return {
            class: 'overflow-auto',
            children: [
                {
                    tag: 'h3',
                    innerText: 'List of packages to install'
                },
                descriptionView({
                    innerText: `Following packages have not been installed yet. 
                    Installation step usually install required dependencies and initialize the asset properly. 
                    Internet connection is usually required here.`
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
                            children: allStatus
                                .filter(status => status.installStatus == "NOT_INSTALLED")
                                .map((status: Status) => {
                                    return {
                                        tag: 'tr',
                                        children: [
                                            nameCell(status),
                                            installCell(this.state, status)
                                        ]
                                    }
                                })
                        }
                    ]

                }
            ]
        }

    }

    pipelinesTableView(allStatus: Array<Status>): VirtualDOM {

        allStatus.filter(status => status.installStatus == "INSTALLED")

        return {
            class: 'overflow-auto',
            children: [
                {
                    tag: 'h3',
                    innerText: 'Pipelines status'
                },
                {
                    tag: 'table', class: 'fv-color-primary  w-100 text-center',
                    style: { 'max-height': '100%' },
                    children: [
                        {
                            tag: 'thead',
                            children: [
                                {
                                    tag: 'tr', class: 'fv-bg-background-alt',
                                    children: [
                                        { tag: 'td', innerText: 'Name' },
                                        { tag: 'td', innerText: 'Version' },
                                        { tag: 'td', innerText: 'Watch' },
                                        { tag: 'td', innerText: 'Actions' },
                                        { tag: 'td', innerText: 'Build Status' },
                                        { tag: 'td', innerText: 'Test Status' },
                                        { tag: 'td', innerText: 'CDN Status' },
                                    ]
                                }
                            ]
                        },
                        {
                            tag: 'tbody',
                            children: allStatus
                                .filter(status => status.installStatus == "INSTALLED")
                                .map((status: Status) => {
                                    return {
                                        tag: 'tr',
                                        class: attr$(
                                            this.state.highlighted$,
                                            highlighted => highlighted.includes(status.name) ? 'fv-bg-background-alt' : "",
                                            {
                                                wrapper: (d) => d + ' fv-hover-bg-background-alt',
                                                untilFirst: 'fv-hover-bg-background-alt',
                                            }
                                        ),
                                        children: [
                                            nameCell(status), versionCell(status),
                                            autoWatchCell(this.state, status),
                                            actionsCell(this.state, status),
                                            buildCell(this.state, status),
                                            testCell(this.state, status),
                                            cdnCell(this.state, status)
                                        ]
                                    }
                                })
                        }
                    ]
                }
            ]
        }
    }
}

let baseClassAction = "fv-pointer p-2 fv-hover-bg-primary fv-hover-text-focus"

let statusDict = {
    'NEVER_BUILT': { color: 'fv-text-focus ', icon: 'fas fa-sync ' + baseClassAction, text: 'never built' },
    'NOT_PUBLISHED': { color: 'fv-text-focus ', icon: 'fas fa-sync ' + baseClassAction, text: '' },
    'GREEN': { color: 'fv-text-success ', icon: 'fas fa-check ', text: '' },
    'RED': { color: 'fv-text-error ', icon: 'fas fa-sync ' + baseClassAction, text: '' },
    'CDN_ERROR': { color: 'fv-text-error ', icon: 'fas fa-times ', text: '' },
    'OUT_OF_DATE': { color: 'fv-text-focus ', icon: 'fas fa-sync ' + baseClassAction, text: '' },
    'INDIRECT_OUT_OF_DATE': { color: 'fv-text-focus ', icon: 'fas fa-sync ' + baseClassAction, text: '(indirect)' },
    'NO_ENTRY': { color: 'fv-text-focus ', icon: 'fas fa-sync ' + baseClassAction, text: '' },
    'SYNC': { color: 'fv-text-success ', icon: 'fas fa-check ' + baseClassAction, text: '' }
}


function nameCell(status: Status) {
    if (status.documentation) {
        return { 
            tag: 'td',  style: { 'font-family': 'cursive', 'font-size': 'large' },
            children:[ 
                {tag: 'a', href: status.documentation, innerText: status.name }
            ]
        }
    }
    return { tag: 'td', innerText: status.name, style: { 'font-family': 'cursive', 'font-size': 'large' } }
}

function versionCell(status: Status) {
    return { tag: 'td', innerText: status.version }
}

function installCell(state: ModulesState, status: Status) {
    let target$ = state.webSocket$.pipe(
        filter((message) => {
            return message.target == status.name && message.action == Action.INSTALL 
        })
    )

    let btn = button('', 'Install')
    btn.state.click$.pipe(
        mergeMap( () => {
            return Backend.modules.install$(status.assetId)
        })
    ).subscribe(
        () => console.log("install done")
    )
    return { 
        class:'d-flex align-items-center',
        children:[ 
            child$( btn.state.click$,
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

function autoWatchCell(state: ModulesState, status: Status) {

    return {
        tag: 'td',
        class: attr$(
            state.autoWatched$,
            (ids) => ids.includes(status.name)
                ? "fas fa-satellite-dish fv-text-focus "
                : "fas fa-satellite-dish ",
            { wrapper: (d) => d + baseClassAction }
        ),
        onclick: () => state.toggleWatch(status.name)
    }
}


function actionsCell(state: ModulesState, status: Status) {
    return {
        tag: 'td',
        children: [
            {
                tag: 'i',
                class: 'far fa-arrow-alt-circle-right ' + baseClassAction,
                onclick: () => execAction(state, { action: Action.SYNC, targetName: status.name, scope: ActionScope.TARGET_ONLY })
            },
            {
                tag: 'i',
                class: 'far fa-arrow-alt-circle-up ' + baseClassAction,
                onclick: () => execAction(state, { action: Action.SYNC, targetName: status.name, scope: ActionScope.ALL_ABOVE }),
                onmouseover: () => {
                    state.dependenciesRequest$.next({assetId:status.assetId, direction: 'up'})
                },
                onmouseout: () => state.highlighted$.next([])
            },
            {
                tag: 'i',
                class: 'far fa-arrow-alt-circle-down ' + baseClassAction,
                onclick: () => execAction(state, { action: Action.SYNC, targetName: status.name, scope: ActionScope.ALL_BELOW }),
                onmouseover: (ev) => {
                    state.dependenciesRequest$.next({assetId:status.assetId, direction: 'down'})
                },
                onmouseout: () => state.highlighted$.next([])
            },
        ]
    }
}


function execAction(state: ModulesState, body) {

    Backend.modules.action$(body).subscribe(d => { })
}

function base(state: ModulesState, targetName: string, action: Action) {

    let target$ = state.webSocket$.pipe(
        filter((message) => {
            return message.target == targetName && message.action == action
        })
    )

    let status$ = new ReplaySubject()

    return {
        tag: 'td',
        class: attr$(status$, ({ color }) => color),
        children: [
            {
                tag: 'i',
                innerText: attr$(status$, ({ text }) => text)
            },
            {
                tag: 'i',
                class: attr$(status$, ({ icon }) => icon),
                onclick: () => execAction(state, { action, targetName, scope: ActionScope.TARGET_ONLY })
            },
            {
                tag: 'i',
                class: attr$(
                    target$.pipe(
                        filter(({ step }) => [ActionStep.STARTED, ActionStep.DONE].includes(step))
                    ),
                    (d) => d.step == ActionStep.STARTED ? 'fas fa-spinner fa-spin' : ''
                )
            }
        ],
        connectedCallback: (elem) => {
            elem.subscriptions.push(
                target$.pipe(
                    filter(({ step, content }) => step == ActionStep.STATUS && statusDict[content] != undefined),
                    map(({ content }) => statusDict[content])
                ).subscribe(d => {
                    status$.next(d)
                })
            )
        }
    }
}

function buildCell(state: ModulesState, status: Status) {
    return base(state, status.name, Action.BUILD)
}
function testCell(state: ModulesState, status: Status) {
    return base(state, status.name, Action.TEST)
}
function cdnCell(state: ModulesState, status: Status) {
    return base(state, status.name, Action.CDN)
}

