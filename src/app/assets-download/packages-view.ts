import { attr$, child$, childrenWithReplace$, HTMLElement$, VirtualDOM } from "@youwol/flux-view"
import { Switch } from "@youwol/fv-button"
import { ExpandableGroup } from "@youwol/fv-group"
import { BehaviorSubject, combineLatest, Observable, ReplaySubject, Subject, Subscription } from "rxjs"
import { filter, map, mergeMap, take, tap } from "rxjs/operators"
import { Backend } from "../backend/router"
import { LogsState, LogsView } from "../logs-view"
import {AssetsGatewayClient, Drive, File as FileYW} from '@youwol/flux-youwol-essentials'
import { ImmutableTree } from "@youwol/fv-tree"
import { ModuleExplorer } from "@youwol/flux-files"
import { RootNode } from "./tree-nodes"
import { DownloadItem } from "../backend/download-packages.router"
import { statusClassesDict } from "../assets-upload/packages/utils"
import { StatusEnum } from "../backend/upload-packages.router"
import { button } from "../utils-view"

export interface Options{
    fetchDependenciesLatest: boolean
}

export class PackagesState{

    fetchDependenciesLatest$ = new BehaviorSubject<boolean>(true)
    
    options$ : Observable<Options> = combineLatest([
        this.fetchDependenciesLatest$
    ]).pipe( 
        map( ([fetchDependenciesLatest]) => ({fetchDependenciesLatest}) ) 
    ) 

    webSocket$: Subject<any> = Backend.downloadPackages.connectWs()


    logsState = new LogsState(
        this.webSocket$.pipe(
            map((message) => message)
        )
    )

    public readonly selectedNode$ = new ReplaySubject<ImmutableTree.Node>()

    public readonly queuedToDownload$ = Backend.downloadPackages.downloadItems$.pipe(
        map( (items: {[key:string]: DownloadItem}) => Object.values(items))
    )
    public readonly toggled$ = new BehaviorSubject<string[]>([])

    constructor(){
        AssetsGatewayClient.basePath = `/remote${AssetsGatewayClient.basePath}`
        this.selectedNode$.pipe(
            filter( node => node instanceof ModuleExplorer.FileNode && 
                node.file instanceof FileYW && node.file.metadata.kind == 'package' ),
            map( (node: ModuleExplorer.FileNode) => node.file as FileYW),
            mergeMap( (file: FileYW) => {
                return Backend.downloadPackages.packageInfo$(file.metadata.rawId)
            })
        ).subscribe()

    }
    
    subscribe() : Array<Subscription> {
        Backend.uploadPackages.status$().subscribe()
        let s0 = Backend.downloadPackages.downloadItems$.subscribe( (items: {[key:string]: DownloadItem}) => {

            let toCheck = Object.values(items)
            .filter( item=>  item.status != StatusEnum.SYNC)
            .map( item => item.name)
            this.toggled$.next(toCheck) 
        })
        return [s0]
    }    

    toggle( name: string){
        let toggled = this.toggled$.getValue().includes(name) 
            ?  this.toggled$.getValue().filter( n =>  n != name) 
            :  this.toggled$.getValue().concat([name])

        this.toggled$.next(toggled)
    } 

    synchronize() {
        combineLatest([
            this.queuedToDownload$,
            this.toggled$]).pipe(
                take(1),
                mergeMap( ([items, toggleds]) => {
                    let filtered = items.filter( item => toggleds.includes(item.name))
                    return Backend.downloadPackages.download$({packages:filtered})
                })
            ).subscribe()
    }
}


export class PackagesView implements VirtualDOM{

    public readonly tag = 'div'
    public readonly children : Array<VirtualDOM> 
    public readonly class = 'fv-text-primary h-100 d-flex flex-column h-100 fv-bg-background-alt'
    public readonly state : PackagesState

    connectedCallback: (elem) => void

    constructor( state : PackagesState ){
        
        this.state = state
        
        this.children = [
            {
                class: "h-75 d-flex flex-column w-100 fv-bg-background py-3",
                children:[
                    this.headerView(),
                    this.contentView()
                ]
            },
            new LogsView(state.logsState)
        ]
        this.connectedCallback = (elem: HTMLElement$) => {
            elem.ownSubscriptions(...this.state.subscribe())
        }
    }

    headerView(){

        let groupState = new ExpandableGroup.State("options", false)
        let switchView = (subject$, title) =>{
            let state = new Switch.State(subject$)
            return {
                class: 'd-flex align-items-center ',
                children: [
                    {
                        innerText: title,
                        class: attr$( state.value$ , (activated) => activated ? "fv-text-focus": '', {wrapper: (d) => d + " px-2"})
                    },
                    new Switch.View({state}),
                ]
            }
        }

        let groupView = new ExpandableGroup.View({
            state: groupState,
            class:'mx-3 mb-3',
            headerView: ExpandableGroup.defaultHeaderView,
            contentView: () => {
                return {
                    class: 'd-flex w-100 justify-content-around align-items-center border rounded ',
                    children:[
                        switchView(this.state.fetchDependenciesLatest$, "fetch dependencies @ latest")
                    ]
                }
            }
        } as any)
        return groupView
    }

    contentView() : VirtualDOM { 

        return {
            class: "h-100 flex-grow-1",
            style:{"min-height":"0px"},
            children:[
                {   class:'d-flex w-100 h-100 justify-content-around',
                    children:[
                        child$(
                            Backend.downloadPackages.connectWs().pipe(take(1)),
                            () => remoteExplorerView(this.state),
                            { untilFirst: { class: "fas fa-spinner fa-spin"} }
                            ),
                        detailsView(this.state)
                    ]
                }
            ]
        }
    }
}


function remoteExplorerView(state: PackagesState): VirtualDOM{

    
    let treeState = new ImmutableTree.State<ImmutableTree.Node>( {

        rootNode: new RootNode({id:'root', name:'groups'}), 
       // expandedNodes: ['root'],
        selectedNode:state.selectedNode$
    })

    let treeView = new ImmutableTree.View({
        state:treeState,
        headerView: treeItemView,
        connectedCallback : (elem) => {
            elem.subscriptions.push(
                state.selectedNode$.subscribe( node => { console.log('Node selected', node)})
            )
        },
        class: 'fv-bg-background fv-text-primary flex-grow-1 overflow-auto',
        style:{'min-height':'0'}
    } as any)

    return {
        class: 'd-flex h-100 flex-column',
        children:[
            {
                innerText: "Remote workspace"
            },
            treeView
        ]
    }
}

function treeItemView(state: ImmutableTree.State<ImmutableTree.Node>, node: ImmutableTree.Node) {

    if(node instanceof ModuleExplorer.FileNode && node.file['metadata'].kind == 'package'){
        
        return {
            class:'d-flex align-items-center fv-pointer',
            children:[ 
                {
                    class:'fas fa-cloud-download-alt fv-hover-text-focus'
                },
                {
                    innerText:node['name'], 
                    class:'px-2'}
            ]
        }
    }
    if(node instanceof ModuleExplorer.FileNode){
        let defaultView = ModuleExplorer.headerView(state as any, node)
        defaultView.class += " fv-text-disabled"
        return defaultView
    }
        
    if(node instanceof ModuleExplorer.Node)
        return ModuleExplorer.headerView(state as any, node)

    return {
        innerText:node['name']
    }
}

function detailsView(state: PackagesState): VirtualDOM{

    let rowView = (item: DownloadItem) => {
        let classes = 'fv-pointer fv-hover-bg-background-alt '
                            
        return {
            tag: 'tr',
            class: classes,
            children: [
                {   tag: 'td', innerText:item.name },
                {   tag: 'td', innerText:item.version },
                {   tag: 'td',
                    children:[
                        {
                            class: statusClassesDict[item.status]
                        }
                    ]
                },
                {
                    tag:'input',
                    type:'checkbox',
                    checked: attr$(
                        state.toggled$,
                        (toggleds) => toggleds.includes(item.name),
                    ),
                    onclick: ()=> state.toggle(item.name)
                }
            ]
        }
    }
    let syncView = (selection: Array<string> ) =>  {

        let content = {}
        if(selection.length==0)
            content = { innerText: 'No items selected for synchronization' , class:'fv-text-focus'}
        else{
            let btn = button('fas fa-sync', `Sync. (${selection.length})`)
            btn.state.click$.subscribe( (d) => state.synchronize())
            content = btn
        }
        return {
            class:'w-100',
            children:[
                { class:" border fv-color-primary" },
                { 
                    class:'m-3',
                    children:[content]
                }
            ]   
        }
    }
    return {
        class: 'd-flex h-100 flex-column',
        children:[
            {
                innerText: "Download queue"
            },
            {
                tag: 'table', 
                class:'w-100 text-center',
                children:[
                    {   tag:'thead',
                        children:[
                            {   tag: 'tr', class:'fv-bg-background-alt',
                                children: [
                                    { tag: 'td', innerText:'Name', class:'px-3'},
                                    { tag: 'td', innerText:'Version', class:'px-3'},
                                    { tag: 'td', innerText:'Status', class:'px-3'},
                                    { tag: 'td', innerText:'Queued?', class:'px-3'}
                                ] 
                            }
                        ]
                    },
                    {   tag:'tbody',
                        children: childrenWithReplace$(
                            state.queuedToDownload$,
                            ( item: DownloadItem) => rowView(item),
                            {}
                        )
                    }
                ]
            },
            child$(
                state.toggled$,
                (items) => syncView(items)
            )
        ]
    }
}

