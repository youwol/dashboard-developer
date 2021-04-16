import { Backend } from "../backend";
import { BehaviorSubject, ReplaySubject } from "rxjs";
import { VirtualDOM, child$, attr$} from '@youwol/flux-view'
import { Library, LibraryStatus, StatusEnum } from "./utils";
import { detailsView } from "./package-details-view";
import { publishView } from "./package-publish-view";
import { tableView } from "./packages-status-view";


export class PackagesState{


    webSocket$ : ReplaySubject<any>
    libraries$ = new BehaviorSubject<Array<Library>>([])

    librariesStatus$ : { [key:string]: ReplaySubject<LibraryStatus> } = {}  
    releasesStatus$ : { [key:string]: { [key:string]:ReplaySubject<StatusEnum> } } = {} 
    syncQueued$ = new BehaviorSubject<Set<string>>(new Set())

    constructor(){

        /*this.webSocket$ = Backend.assets.connectWs() 
        this.webSocket$.subscribe( ({assetId, libraryName, status, details }) => {

            this.librariesStatus$[assetId].next({assetId, status, details})

            if( status == StatusEnum.NOT_FOUND ){
                         
                Object
                .values(this.releasesStatus$[assetId])
                .forEach( s$ => s$.next(StatusEnum.NOT_FOUND) ) 
            }
            if( status == StatusEnum.SYNC )  {          
                Object
                .values(this.releasesStatus$[assetId])
                .forEach( s$ => s$.next(StatusEnum.SYNC) ) 
                let syncNeeded = this.syncQueued$.getValue()
                syncNeeded.delete(assetId)
                this.syncQueued$.next(syncNeeded)
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
            if( status == StatusEnum.PROCESSING && details && details.version)
                this.releasesStatus$[assetId][details.version].next(StatusEnum.PROCESSING)
        })*/
    }
    
    getLibrarie$(){

        Backend.assets.packages.status$().subscribe( ({libraries}:{libraries:Array<Library>}) => {
            let syncNeeded = this.syncQueued$.getValue()
            libraries.forEach( (asset: Library) => {
                this.librariesStatus$[asset.assetId] = new ReplaySubject() 
                this.releasesStatus$[asset.assetId] = {}
                asset.treeItems.length >0 && syncNeeded.add(asset.assetId)
            })

            libraries
            .reduce( (acc,{assetId, releases}) => acc.concat(releases.map( ({version}) => ({ assetId, version }))), [])
            .map( ({assetId,version}) => {
                this.releasesStatus$[assetId][version] = new ReplaySubject()
            })
            this.libraries$.next(libraries)
            this.syncQueued$.next(syncNeeded)
        })
        return this.libraries$
    }
}

export class PackagesView implements VirtualDOM{

    public readonly tag = 'div'
    public readonly children : Array<VirtualDOM> 
    public readonly class = 'p-2 fv-text-primary h-100 d-flex flex-column h-100 fv-bg-background-alt'
    public readonly state : PackagesState

    connectedCallback: (elem) => void

    selected$ = new ReplaySubject<Library>()

    constructor( state : PackagesState ){
        
        this.state = state

        this.children = [
            child$(
                this.state.getLibrarie$(),
                (libraries) => this.contentView(libraries)
            )
        ]
        this.connectedCallback = (elem) => {
        }
    }

    contentView( libraries: Array<Library> ) : VirtualDOM { 

        return {
            class: attr$(
                this.selected$,
                () => 'h-50',
                {   untilFirst: 'h-100' }
            ),
            children:[
                {   class:'d-flex w-100 h-100',
                    children:[
                        tableView( libraries,  this.selected$ , this.state.librariesStatus$),
                        child$( 
                            this.state.libraries$,
                            (libraries) => publishView(libraries, this.state.releasesStatus$, this.state.syncQueued$) 
                        )
                    ]
                },
                child$( 
                    this.selected$,
                    (selected) => detailsView(selected, this.state.librariesStatus$[selected.assetId]) 
                )
            ]
        }
    }
}


