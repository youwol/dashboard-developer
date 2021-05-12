import { Interfaces, ModuleExplorer } from "@youwol/flux-files"
import { AssetsGatewayClient, Drive } from "@youwol/flux-youwol-essentials"
import { ImmutableTree } from "@youwol/fv-tree"
import { ReplaySubject, Subject } from "rxjs"
import { filter, map } from "rxjs/operators"
import { Group } from "../backend/download-packages.router"
import { Backend } from "../backend/router"



export class RootNode extends ModuleExplorer.Node{

    static events$ = new ReplaySubject<Interfaces.EventIO>()
    
    static groups$() {
        let assetsGtwClient = new AssetsGatewayClient({basePath:`/remote/api/assets-gateway`})
        return assetsGtwClient.getGroups(RootNode.events$).pipe(
            map(({groups}: {groups:Array<Group>}) => {
                return groups.map( group => new GroupNode({group}))
            }) 
        )
    }
    constructor({id, name}: {id: string, name: string} ){
        super({id, name, children:RootNode.groups$(), events$: RootNode.events$  })

        RootNode.events$.subscribe(d => {
            console.log("GOT an event", d)
        })
    }
}

export class GroupNode extends ModuleExplorer.Node{

    public readonly group: Group
    public readonly name: string
    static events$ = new ReplaySubject<Interfaces.EventIO>()

    static drives$(groupId: string) {
        let assetsGtwClient = new AssetsGatewayClient({basePath:`/remote/api/assets-gateway`})
        return assetsGtwClient.getDrives(groupId, GroupNode.events$).pipe(
            map(({drives}) => {
                return drives.map( ({driveId,name}) => {
                    let drive = new Drive(driveId, name, assetsGtwClient)
                    return new ModuleExplorer.DriveNode({drive}) 
                })
            })
        )
    }
    constructor(
        {group}: { group: Group} ){
        super({ 
            id: group.id, 
            name:  group.path, 
            children: GroupNode.drives$(group.id),
            events$: GroupNode.events$.pipe(filter( event => event.targetId == group.id))
        })
        this.group = group
        this.name = group.path
    }
}


