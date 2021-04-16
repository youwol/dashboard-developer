import { child$, VirtualDOM } from "@youwol/flux-view";
import { Select } from "@youwol/fv-input";
import { BehaviorSubject, combineLatest, Observable } from "rxjs";
import { skip } from "rxjs/operators";
import { button } from "../utils-view";
import { GeneralState } from "./general.view";
import { Environment } from "./models";



export function configurationPickerView(environment$: Observable<Environment>, configurationPaths$: Observable<Array<string>>){

    let editionMode$ = new BehaviorSubject<boolean>(false)
    let btn = button('fas fa-plus', 'pick file')
    btn.state.click$.subscribe(()=> editionMode$.next(!editionMode$.getValue()))
    return {
        class: 'flex-grow-1',
        children: [
            {   class: 'd-flex align-items-center',
                children: [
                    {
                        class: 'p-2', 
                        style: { 'font-size': 'x-large' },
                        innerText: 'configuration:'
                    },
                    child$(
                        combineLatest([
                            environment$,
                            configurationPaths$,
                            editionMode$
                        ]),
                        ([env, paths, editionMode]) => {
                            if(editionMode)
                                return configurationPathInput(editionMode$)
                            return configurationPathSelect(env, paths) 
                        }
                    ),
                    child$(
                        editionMode$,
                        (editionMode) => editionMode
                            ? {}
                            : btn
                    )
                ]
            }
        ]
    }
}


function configurationPathSelect(env: Environment, paths: Array<string>): VirtualDOM {

    let items = paths.map(p => new Select.ItemData(p, p))

    let selectState = new Select.State(items, env.configurationPath)
    selectState.selection$.pipe(
        skip(1)
    ).subscribe((d) => {
        GeneralState.switchConfiguration(d.id)
    })
    return new Select.View({ state: selectState })
}

function configurationPathInput(editionMode$): VirtualDOM {

    return {
        tag: 'input',
        class: 'flex-grow-1',
        type: 'text',
        placeholder: "Enter the full local path of the file and press 'enter'",
        onkeypress: (ev) => {
            if (ev.key == "Enter") {
                GeneralState.switchConfiguration(ev.target.value)
                // otherwise the onbluer event is triggered while the element does not exist anymore
                ev.target.onblur = () => { }
                editionMode$.next(false)
            }
        },
        onblur: (ev) => editionMode$.next(false)
    }
}