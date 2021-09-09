import { Backend } from "../../backend/router";
import { BehaviorSubject, Observable, of, ReplaySubject, Subject } from "rxjs";
import { attr$, child$, VirtualDOM} from '@youwol/flux-view'
import { LogsState, LogsView } from "../../logs-view";
import { filter, map, tap } from "rxjs/operators";
import { FluxApp, StatusEnum } from "../../backend/upload-flux-apps.router";
import { ImmutableTree } from "@youwol/fv-tree";
import { ModuleExplorer } from "@youwol/flux-files";
import { GroupNode, RootNode } from "../../shared-views/tree-nodes";
import { DataAsset } from "src/app/backend/upload-data.router";



export class State{

    webSocket$: Subject<any> = Backend.uploadData.connectWs()

    logsState = new LogsState(
        this.webSocket$.pipe(
            map((message) => message)
        )
    )

    constructor( public readonly appState){
    }
    
    subscribe() {
        return []
    }    
}


export class View implements VirtualDOM{

    public readonly tag = 'div'
    public readonly children : Array<VirtualDOM> 
    public readonly class = 'fv-text-primary h-100 d-flex flex-column h-100 fv-bg-background-alt'
    public readonly state : State

    connectedCallback: (elem) => void

    selected$ = new ReplaySubject<DataAsset>()

    constructor( state : State ){
        
        this.state = state
        
        this.children = [
            {
                class: "h-75 d-flex flex-column w-100 fv-bg-background py-3",
                children:[
                    this.contentView()
                ]
            },
            new LogsView(state.logsState)
        ]
    }


    contentView() : VirtualDOM { 

        return {
            class: "h-100 flex-grow-1",
            style:{
                "min-height":"0px"
            },
            children:[
                {   class:'d-flex w-100 h-100 justify-content-around',
                    children:[
                        explorerView(this.state)
                    ]
                }
            ]
        }
    }
}

class ExplorerState extends ImmutableTree.State<ImmutableTree.Node>{

    status$: Observable<{assetId:string, status:StatusEnum}>

    constructor({rootNode, status$,expandedNodes}) {
        super({rootNode,expandedNodes})

        this.status$ = status$
    }
}

function explorerView(state: State): VirtualDOM{

    
    let treeState = new ExplorerState( {

        rootNode: new RootNode({id:'root', name:'groups', basePath: `/api/assets-gateway`}), 
        status$: state.webSocket$.pipe( 
            filter( message => message.assetId && message.status)
        ),
        expandedNodes: ['root'],
    })

    let treeView = new ImmutableTree.View({
        state:treeState,
        headerView: treeItemView,
        class: 'fv-bg-background fv-text-primary flex-grow-1 overflow-auto',
        style:{'min-height':'0'}
    } as any)

    return {
        class: 'd-flex h-100 flex-column',
        children:[
            {
                innerText: "Local workspace to import data:"
            },
            treeView
        ]
    }
}

function treeItemView(state: ExplorerState, node: ModuleExplorer.Node) {

    let customHeadersView = [
        {
            target: ( n : ModuleExplorer.Node) => n instanceof ModuleExplorer.FileNode && n.file['metadata'].kind == 'package',
            classes: 'd-flex align-items-center fv-pointer',
            icon: 'fas fa-cloud-download-alt'
        },
        {   target: ( n : ModuleExplorer.Node) => n instanceof ModuleExplorer.FileNode,
            classes: 'd-flex align-items-center fv-pointer fv-text-disabled'
        },
        {   target: ( n : ModuleExplorer.Node) => n instanceof GroupNode && n.id.includes('private'),
            icon: 'fas fa-user',
        },
        {   target: ( n : ModuleExplorer.Node) => (n instanceof RootNode) || (n instanceof GroupNode && !n.id.includes('private')) ,
            icon: 'fas fa-users',
        }
    ]
    if(node instanceof  ModuleExplorer.FileNode && node.file['metadata'] && node.file['metadata'].kind == 'data' ){
        return {
            class:'d-flex align-items-center',
            children:[
                { 
                    innerText : node.name
                },
                {   
                    onclick: () =>  Backend.uploadData.publish$(node.id).subscribe(),
                    class: 'fas fa-cloud-upload-alt fv-hover-text-focus mx-2 fv-pointer'
                },
                child$(
                    state.status$.pipe( 
                        filter( message => message.assetId == node.id )),
                    ({status}) => {
                        return status == StatusEnum.PROCESSING
                            ? { class:'fas fa-spinner fa-spin fv-text-focus'}
                            : {}
                    }),
            ]
        }
    }
    return  ModuleExplorer.headerView(state as any, node, customHeadersView)
}
