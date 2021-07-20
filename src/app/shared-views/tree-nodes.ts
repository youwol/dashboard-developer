import { Interfaces, ModuleExplorer } from "@youwol/flux-files"
import { AssetsGatewayClient, Drive } from "@youwol/flux-youwol-essentials"
import { ImmutableTree } from "@youwol/fv-tree"
import { ReplaySubject, Subject } from "rxjs"
import { filter, map } from "rxjs/operators"
import { Group } from "../backend/download-packages.router"
import { Backend } from "../backend/router"



export class RootNode extends ModuleExplorer.Node{

    public readonly basePath: string
    static events$ = new ReplaySubject<Interfaces.EventIO>()

    static groups$(basePath:string) {
        let assetsGtwClient = new AssetsGatewayClient({basePath})
        return assetsGtwClient.getGroups(RootNode.events$).pipe(
            map(({groups}: {groups:Array<Group>}) => {
                return groups.map( group => new GroupNode({group, basePath}))
            }) 
        )
    }

    constructor({id, name, basePath}: {id: string, name: string, basePath: string} ){
        super({id, name, children:RootNode.groups$(basePath), events$: RootNode.events$  })
        this.basePath = basePath
    }
}

export class GroupNode extends ModuleExplorer.Node{

    public readonly group: Group
    public readonly name: string
    public readonly basePath: string

    static events$ = new ReplaySubject<Interfaces.EventIO>()

    static drives$(groupId: string, basePath: string) {
        let assetsGtwClient = new AssetsGatewayClient({basePath})
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
        {group, basePath}: { group: Group, basePath: string} ){
        super({ 
            id: group.id, 
            name:  group.path, 
            children: GroupNode.drives$(group.id, basePath),
            events$: GroupNode.events$.pipe(filter( event => event.targetId == group.id))
        })
        this.group = group
        this.name = group.path
        this.basePath = basePath
    }
}


