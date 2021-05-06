import { Backend } from "../../backend/router";
import { BehaviorSubject, combineLatest,ReplaySubject, Subject } from "rxjs";
import { VirtualDOM, child$, attr$} from '@youwol/flux-view'
import { publishView } from "./package-publish-view";
import { tableView } from "./packages-status-view";
import { LogsState, LogsView } from "../../logs-view";
import { map } from "rxjs/operators";
import { Switch } from "@youwol/fv-button";
import { ExpandableGroup } from "@youwol/fv-group";
import { Package } from "src/app/backend/upload-packages.router";


export interface Options{
    showSynced: boolean
    showNext: boolean
}
export class PackagesState{

    showSynced$ = new BehaviorSubject<boolean>(false)
    showNext$ = new BehaviorSubject<boolean>(false)
    options$ = combineLatest([
        this.showSynced$,
        this.showNext$
    ]).pipe( 
        map( ([showSynced, showNext]) => ({showSynced, showNext}) ) 
    ) 

    webSocket$: Subject<any> = Backend.uploadPackages.connectWs()

    syncQueued$ = new BehaviorSubject<Set<string>>(new Set())
    underSynchronization$ = new BehaviorSubject<Set<string>>(new Set())

    logsState = new LogsState(
        this.webSocket$.pipe(
            map((message) => message)
        )
    )

    constructor( public readonly appState){
    }
    
    subscribe() {
        Backend.uploadPackages.status$().subscribe()
        return []
    }    

    toggleSync( assetId: string, version: string) {

        let fullId = assetId+"#"+version
        let actualValues = this.syncQueued$.getValue();
        (actualValues.has(fullId))
            ? actualValues.delete(fullId)
            : actualValues.add(fullId)

        this.syncQueued$.next(actualValues)
    }


    isToggled$( assetId: string, version: string) {

        let fullId = assetId+"#"+version
        return this.syncQueued$.pipe(
          map( (ids) => ids.has(fullId) )
        )
    }

    synchronize(){

        let body = { assetIds: Array.from(this.syncQueued$.getValue())
            .map( fullId => ({ assetId : fullId.split("#")[0], version: fullId.split("#")[1]})) }
        Backend.uploadPackages.syncPackages$(body).subscribe()
    }    
}


export class PackagesView implements VirtualDOM{

    public readonly tag = 'div'
    public readonly children : Array<VirtualDOM> 
    public readonly class = 'fv-text-primary h-100 d-flex flex-column h-100 fv-bg-background-alt'
    public readonly state : PackagesState

    connectedCallback: (elem) => void

    selected$ = new ReplaySubject<Package>()

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
        this.selected$.subscribe( selected => {

            console.log(selected)
            this.state.appState.addTabUpload(selected)
        })
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
                        switchView(this.state.showSynced$, "display synced items"),
                        switchView(this.state.showNext$, "display '-next' items")
                    ]
                }
            }
        } as any)
        return groupView
    }

    contentView() : VirtualDOM { 

        return {
            class: "h-100 flex-grow-1",style:{"min-height":"0px"},
            children:[
                {   class:'d-flex w-100 h-100 justify-content-around',
                    children:[
                        child$(
                            combineLatest([Backend.uploadPackages.packages$, this.state.options$]),
                            ([packages, options]) => {
                                return tableView( Object.values(packages), options,  this.selected$ , this.state)
                            }
                        ),
                        child$( 
                            combineLatest([Backend.uploadPackages.packageVersions$, this.state.options$]),
                            ([packages, options]) => publishView(Object.values(packages), options, this.state) 
                        )
                    ]
                }
            ]
        }
    }
}


