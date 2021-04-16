
import { VirtualDOM } from "@youwol/flux-view"



export class PackagesState{
    constructor(){
    }
}


export class PackagesView implements VirtualDOM{

    public readonly tag = 'div'
    public readonly children : Array<VirtualDOM> 
    public readonly class = 'p-5  fv-text-primary h-100 d-flex flex-column h-100'
    public readonly state : PackagesState
    connectedCallback: (elem) => void

    constructor( state : PackagesState ){
        
        this.state = state

        this.children = []

        this.connectedCallback = (elem) => {
            elem.subscriptions.push( 
                //Backend.modules.status$().subscribe( s => this.state.status$.next(s)) 
            )
        }
    }
}

