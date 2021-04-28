import { Backend } from "../backend";
import { BehaviorSubject, combineLatest, ReplaySubject, Subject } from "rxjs";
import { VirtualDOM, child$, attr$, HTMLElement$} from '@youwol/flux-view'
import { Library, LibraryStatus, StatusEnum } from "./utils";
import { publishView } from "./package-publish-view";
import { tableView } from "./packages-status-view";
import { LogsState, LogsView } from "../logs-view";
import { filter, map, tap } from "rxjs/operators";
import { Switch } from "@youwol/fv-button";
import { ExpandableGroup } from "@youwol/fv-group";


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

    libraries$ = new BehaviorSubject<Array<Library>>([])

    librariesStatus$ : { [key:string]: ReplaySubject<LibraryStatus> } = {}  
    releasesStatus$ : { [key:string]: { [key:string]:ReplaySubject<StatusEnum> } } = {} 

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

        let s1 = Backend.uploadPackages.status$().subscribe( ({libraries}:{libraries:Array<Library>}) => {
            
            libraries.forEach( (asset: Library) => {
                this.librariesStatus$[asset.assetId] = new ReplaySubject() 
                this.releasesStatus$[asset.assetId] = {}
            })

            libraries
            .reduce( (acc,{assetId, releases}) => acc.concat(releases.map( ({version}) => ({ assetId, version }))), [])
            .map( ({assetId,version}) => {
                this.releasesStatus$[assetId][version] = new ReplaySubject()
            })
            this.libraries$.next(libraries)
        })
        // this is a message related to a library version
        let s2 = this.webSocket$.pipe( filter( m => m.assetId && m.status && m.details && m.version) )
        .subscribe( ({assetId, version, status}) => {

            this.releasesStatus$[assetId][version].next(status)

            if(status==StatusEnum.PROCESSING){
                // remove the checkbox's 'checked' status
                if(this.syncQueued$.getValue().has(assetId+"#"+version))
                    this.toggleSync(assetId, version)
                let underSync = this.underSynchronization$.getValue()
                underSync.add( assetId+"#"+version)
                this.underSynchronization$.next(underSync)
            }
            if(status==StatusEnum.DONE){
                let underSync = this.underSynchronization$.getValue()
                underSync.delete( assetId+"#"+version)
                this.underSynchronization$.next(underSync)
            }
        })

        // this is a message related to a package (all version of a library)
        let s3 = combineLatest([
            this.webSocket$.pipe( filter( m => m.assetId && m.status && m.details && !m.version) ),
            this.libraries$.pipe( filter( m => m.length > 0) )
        ])
        .subscribe( ([message, _ ]: [LibraryStatus, any]) => {

            let {assetId, status, details} = message
            this.librariesStatus$[assetId].next(message)

            if( status == StatusEnum.NOT_FOUND ){
                         
                Object
                .values(this.releasesStatus$[assetId])
                .forEach( s$ => s$.next(StatusEnum.NOT_FOUND) ) 
            }
            if( status == StatusEnum.SYNC )  {          
                Object
                .values(this.releasesStatus$[assetId])
                .forEach( s$ => s$.next(StatusEnum.SYNC) ) 
            }
            if( status == StatusEnum.MISMATCH ) {
                
                Object
                .entries(this.releasesStatus$[assetId])
                .forEach( ([k,s$]) =>{    

                    if(details.missing.includes(k))
                        s$.next(StatusEnum.NOT_FOUND) 
                    if(details.mismatch.includes(k))
                        s$.next(StatusEnum.MISMATCH)     
                    if(details.sync.includes(k))
                        s$.next(StatusEnum.SYNC)  
                }) 
            }
        })
        return [s1, s2, s3]
    }

    publishStatus$(assetId:string, version: string) {

        return combineLatest( [
            this.releasesStatus$[assetId][version],
            this.underSynchronization$
        ]).pipe( 
            map( ([status, underSync]) => {
                if(underSync.has(assetId+"#"+version))
                    return StatusEnum.PROCESSING
                return status
            })
        )
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

    selected$ = new ReplaySubject<Library>()

    constructor( state : PackagesState ){
        
        this.state = state
        
        
        this.children = [
            {
                class: "h-75 d-flex flex-column w-100 fv-bg-background py-3",
                children:[
                    this.headerView(),
                    child$(
                        this.state.libraries$,
                        (libraries) => this.contentView(libraries)
                    ),
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
    contentView( libraries: Array<Library> ) : VirtualDOM { 

        return {
            class: "h-100 flex-grow-1",style:{"min-height":"0px"},
            children:[
                {   class:'d-flex w-100 h-100 justify-content-around',
                    children:[
                        tableView( libraries,  this.selected$ , this.state),
                        child$( 
                            this.state.libraries$,
                            (libraries) => publishView(libraries, this.state) 
                        )
                    ]
                },
                /*child$( 
                    this.selected$,
                    (selected) => detailsView(selected, this.state.librariesStatus$[selected.assetId]) 
                )*/
            ]
        }
    }
}


