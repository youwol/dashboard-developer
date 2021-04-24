import { VirtualDOM, child$, attr$ } from '@youwol/flux-view'
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { map } from 'rxjs/operators'
import { GeneralState } from './environment/general.view'
import { Environment } from './environment/models'


export enum PanelId{
    ConfigurationGeneral = "conf.general",
    ConfigurationRawFile = "conf.raw-file",
    LocalEnvPackage = "local.packages",
    LocalEnvFronts = "local.fronts",
    LocalEnvBacks = "local.backs",
    AssetsUploadPackages = "upload.packages",
    AssetsUploadFluxApp = "upload.fluxapp",
    AssetsUploadData = "upload.fluxdata",
}

let tabsDisplayInfo = {
    [PanelId.ConfigurationGeneral]: { title: "General", enabled: true},
    [PanelId.ConfigurationRawFile]: { title: "Raw file", enabled: true},
    [PanelId.LocalEnvPackage]: { title: "Packages", enabled: true},
    [PanelId.LocalEnvFronts]: { title: "Front Ends", enabled: true},
    [PanelId.LocalEnvBacks]: { title: "Back Ends", enabled: true},
    [PanelId.AssetsUploadPackages]: { title: "Packages", enabled: true},
    [PanelId.AssetsUploadFluxApp]: { title: "Flux app", enabled: false},
    [PanelId.AssetsUploadData]: { title: "Data", enabled: false},
}

export class SideBarView implements VirtualDOM{

    public readonly tag = 'div'
    public readonly class = "d-flex justify-content-center py-5 px-2 border h-100"
    public readonly style = { 'min-width':'300px'}
    public readonly selected$ = new BehaviorSubject<PanelId>(PanelId.ConfigurationGeneral)


    public readonly children = [
        {
            class:"h-100 mx-auto d-flex flex-column",
            children:[ {
                tag:'a',
                class: 'fas fa-home mb-5',
                href:'/ui/workspace-explorer',
                innerText:'Explorer',
                style:{'font-size': 'xx-large'}
            },
            sectionGeneric(
                'Environment',
                'fas fa-users-cog my-2',
                [PanelId.ConfigurationGeneral, PanelId.ConfigurationRawFile],
                this.selected$
            ),
            sectionGeneric(
                'My computer',
                'fas fa-laptop-code my-2',
                [PanelId.LocalEnvPackage,PanelId.LocalEnvFronts,PanelId.LocalEnvBacks],
                this.selected$
            ),
            sectionGeneric(
                'Upload assets',
                'fas fa-cloud-upload-alt my-2',
                [PanelId.AssetsUploadPackages/*,PanelId.AssetsUploadFluxApp,PanelId.AssetsUploadData*/],
                this.selected$
            ),
            sectionGeneric(
                'Download assets',
                'fas fa-cloud-download-alt my-2',
                [/*PanelId.AssetsUploadPackages,PanelId.AssetsUploadFluxApp,PanelId.AssetsUploadData*/],
                this.selected$,
                false
            ),
            sectionResources()
            ]
        }
       
    ]

    constructor(){
    }
}

function sectionTitle( 
    name: string,
    classes: string,
    sectionSelected$:Observable<boolean>,
    enabled: boolean = true
    ) : VirtualDOM {

    return {   
        class: attr$( 
            sectionSelected$,
            (selected) => selected ? 'fv-text-focus' : '',
            {wrapper: (d) => d+ "  d-flex align-items-center fa-2x "+ (enabled? 'fv-pointer': '')}
        ),
        children:[
            {
                tag:'i',
                class: classes+" pr-3"
            },
            {
                tag:'h4', innerText:name, style:{'user-select': 'none'}
            }
        ]
    }
 }

 function subSectionsList( targets: Array<PanelId>, selected$:Subject<PanelId>)  {

     return {
        tag: 'ul',
        children:targets.map( panelId => 
            tabSubSection(panelId, selected$)
        )
    }

 }
function tabSubSection( target: PanelId, selected$:Subject<PanelId>) : VirtualDOM {

    let enabled = tabsDisplayInfo[target].enabled
   return {
       tag:'li',
        innerText: tabsDisplayInfo[target].title,
        class: attr$( 
            selected$,
            (panelId) => panelId == target ? 'fv-text-focus' : (enabled ? 'fv-pointer' : 'fv-text-background-alt')
        ),
        style:{'user-select': 'none'},
        onclick: (ev) => {
            enabled && selected$.next(target)
            ev.stopPropagation() 
        }
    }
}

function sectionGeneric(name: string, classes: string, targets: Array<PanelId>, selected$:Subject<PanelId>, enabled: boolean =true){

    let sectionSelected$ = selected$.pipe(
        map( selected => targets.includes(selected))
    )

    return {
        class: 'my-2 '+(enabled ? '' : 'fv-text-disabled'),
        children:[
            sectionTitle(name, classes, sectionSelected$, enabled),
            subSectionsList(targets, selected$)
        ],
        onclick:()=> selected$.next(targets[0])
    }
}

function sectionResources(){

    return {
        class: 'my-2 ',
        children:[
            sectionTitle('Resources', 'fas fa-book', new BehaviorSubject(false)),
            child$(
                GeneralState.environment$,
                (environment:Environment) => {
                    return {
                        tag:'ul',
                        class:'d-flex flex-column',
                        children: Object.entries(environment.configuration.general.resources).map( ([name,url]) => {
                            return {
                                tag:'li',
                                children:[{
                                    tag:'a',
                                    href:url,
                                    innerText:name
                                }]
                            }
                        })
                    }
                }
            )
        ],
    }
}
