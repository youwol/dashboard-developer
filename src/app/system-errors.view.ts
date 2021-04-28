import { render } from "@youwol/flux-view";
import { ExpandableGroup, Modal } from "@youwol/fv-group";
import { Observable } from "rxjs";


interface SystemError {

    details: string
    url: string
    trace: Array<string>
}

class ModalState extends Modal.State {

    constructor(public readonly error: SystemError) {
        super()
    }
}
function contentView(state: ModalState) {

    let expGroupState = new ExpandableGroup.State("trace")
    let expGroupView = new ExpandableGroup.View({
        state: expGroupState,
        headerView: ExpandableGroup.defaultHeaderView,
        contentView: () => {
            return {
                children: state.error.trace.map(elem => {
                    return { innerText: elem }
                })
            }
        }
    })
    return {
        class: 'fv-color-focus rounded fv-bg-background fv-text-primary d-flex flex-column p-4',
        children: [
            {   tag: 'h2',
                class: 'text-center w-100 py-2 fv-text-error',
                innerText: "System error"
            },
            {
                class: 'text-center w-100 py-2',
                innerText: "Details: " + state.error.details
            },
            expGroupView
        ]
    }
}

export function plugSystemErrors(errors$: Observable<SystemError>) {

    errors$.subscribe(error => {

        let state = new ModalState(error)
        let view = new Modal.View({ state, contentView })
        let modalDiv = render(view)
        document.querySelector("body").appendChild(modalDiv)

        state.ok$.subscribe(() => modalDiv.remove())
        state.cancel$.subscribe(() => modalDiv.remove())
    })
}