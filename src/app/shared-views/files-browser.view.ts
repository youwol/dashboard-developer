import { child$, children$, render, VirtualDOM } from "@youwol/flux-view"
import { Modal } from "@youwol/fv-group"
import { BehaviorSubject, Subject } from "rxjs"
import { mergeMap } from "rxjs/operators"
import { Backend } from "../backend/router"


export function filesBrowserView({ startingFolder, originFolderIndex, configFileView, style} : {
    startingFolder:Array<string>,
    originFolderIndex: number,
    configFileView?,
    style?
}){

    let folderSelected$ = new BehaviorSubject<Array<string>>(startingFolder)
    let items$ = folderSelected$.pipe(
        mergeMap( (path) => Backend.system.folderContent$(path))
    )
    configFileView = configFileView || ( (_,name) =>fileView(name) )

    return {
        class:'fv-bg-background fv-text-primary border rounded p-4 w-100 overflow-auto',
        style: style || {},
        children: [
            originLocationView(startingFolder, originFolderIndex),
            folderNavigationView(folderSelected$, originFolderIndex),
            {   class: 'my-4',
                children: children$(
                    items$,
                    ({ configurations, files, folders}) => {
                        
                        let configsVDom= configurations
                        .map( name => configFileView(folderSelected$, name))
                        
                        let filesVDom= files.map( name => fileView(name))
                        let foldersVDom= folders.map( name => folderView(folderSelected$, name))
                        return [ ...configsVDom, ...foldersVDom, ...filesVDom]
                    })
            }
        ]
    }
}

function originLocationView(startingFolder: Array<string>, originFolderIndex: number): VirtualDOM{

    if(originFolderIndex==0){
        return {}
    }
    return {
        class:'d-flex  mx-2',
        children:[
            {
                innerText: 'origin location:'
            },
            {   class:'px-2',
                innerText: startingFolder
                .slice(1, originFolderIndex)
                .reduce( (acc,e) => `${acc}/${e}`)
            }
        ]
    }
}

function folderNavigationView(
    folderSelected$:BehaviorSubject<Array<string>>,
    originFolderIndex: number
    ){
    return {
        class: 'd-flex',
        children: children$(
            folderSelected$,
            (paths: Array<string>) => paths.slice(originFolderIndex).map( (element) => pathElementView(folderSelected$, element))
        )
    }
}
function pathElementView(
    folderSelected$: BehaviorSubject<Array<string>>, 
    element: string
    ): VirtualDOM {

    let index = folderSelected$.getValue().indexOf(element)
    
    return { 
        class:'px-2 fv-pointer fv-hover-bg-background-alt border rounded mx-2', 
        innerText: element,
        onclick: () => folderSelected$.next(folderSelected$.getValue().slice(0,index+1))
    
    }
}


function fileView( name:string): VirtualDOM{

    return { 
        class:'d-flex  align-items-center fv-text-disabled', 
        style:{"user-select": 'none'},
        children: [
            { class: 'fas fa-file px-2'},
            { innerText: name }
        ]
    }
}

function folderView(
    folderSelected$: BehaviorSubject<Array<string>>, 
    name:string
    ): VirtualDOM{

    return { 
        class:'fv-pointer d-flex align-items-center fv-hover-bg-background-alt', 
        children: [
            { 
                class: 'fas fa-folder px-2'
            },
            { 
                innerText:  name, 
                onclick: ()=>folderSelected$.next( folderSelected$.getValue().concat(name)) 
            }
        ]
    }
}