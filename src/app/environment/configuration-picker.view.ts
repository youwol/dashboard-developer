import { child$, VirtualDOM } from "@youwol/flux-view";
import { Observable } from "rxjs";
import { popupFilesBrowserView } from "./files-browser.view";
import { Environment } from "./models";



export function configurationPickerView(environment: Environment){

    return {
        class: 'flex-grow-1',
        children: [
            {   class: 'd-flex align-items-center',
                children: [
                    {
                        class: 'p-2', 
                        style: { 'font-size': 'large' },
                        innerText: 'configuration:'
                    },
                    configurationPathView(environment),
                    {
                        class:'fv-pointer mx-3 fas fa-folder-open border rounded p-2 fv-hover-bg-background-alt',
                        onclick: () => popupFilesBrowserView(environment) 
                    }
                ]
            }
        ]
    }
}


function configurationPathView(environment: Environment): VirtualDOM {
    
    return { 
        class: 'fv-text-focus fv-pointer', 
        innerText: environment.configurationPath.slice(1).join('/'), 
        style: { 'font-size': 'large' },
        onclick: () => popupFilesBrowserView(environment) 
    }
}
