import { attr$, child$, render } from "@youwol/flux-view"
import { Modal } from "@youwol/fv-group"
import { Select } from "@youwol/fv-input"
import { BehaviorSubject, combineLatest, ReplaySubject, Subject } from "rxjs"
import { map, mergeMap } from "rxjs/operators"
import { button } from "../utils-view"


export interface SkeletonParameters {

    displayName: string
    id: string
    type: string
    description: string
    placeholder: string
    required: boolean
    defaultValue: any
}


export interface SkeletonResponse {

    name: string
    description: string
    parameters: Array<SkeletonParameters>
}


class SkeletonItem extends Select.ItemData {

    data: SkeletonResponse

    constructor(data: SkeletonResponse) {
        super(data.name, data.name)
        this.data = data
    }
}

export function newSkeletonModalView(
    title: string, 
    skeletons: Array<SkeletonResponse>,
    backendRouter: any) {

    let items = skeletons.map(s => new SkeletonItem(s))

    let selectState = new Select.State(items, items[0].id)

    let modalState = new Modal.State()

    let okBtn = button('', 'Create')

    let parameters$ = new ReplaySubject<Array<{ [key: string]: any }>>(1)
    let modalContent = () => {
        return {
            class: 'fv-text-primary fv-bg-background-alt p-4 rounded border fv-color-primary',
            style: { 'max-width': '75%' },
            children: [

                {
                    class: 'd-flex align-items-baseline py-2 text-center mx-auto justify-content-center',
                    children: [
                        {
                            tag: 'h3',
                            class: 'text-center fv-text-focus',
                            innerText: title
                        },
                        new Select.View({ state: selectState, class: 'mx-2', style: { 'font-size': 'x-large' } } as any)
                    ]
                },
                child$(
                    selectState.selection$,
                    (s: SkeletonItem) => skeletonView(s, parameters$)
                ),
                { tag: 'hr', class: 'fv-color-primary' },
                child$(
                    parameters$,
                    (s: SkeletonItem) => okBtn
                )
            ]
        }
    }
    let view = new Modal.View({ state: modalState, contentView: modalContent })
    let div = render(view)
    document.body.appendChild(div)
    modalState.cancel$.subscribe(() => div.remove())
    okBtn.state.click$
        .pipe(
            mergeMap(() => parameters$),
            mergeMap((parameters) => backendRouter.createSkeleton$(selectState.selectionId$.getValue(), { parameters })),
        )
        .subscribe((resp) => {
            div.remove()
        })

}

function descriptionView(description: string) {

    return {
        children: [
            { tag: 'hr', class: 'fv-color-primary' },
            {
                class: 'd-flex align-items-center',
                children: [
                    {
                        tag: 'i',
                        class: 'fas fa-info-circle fa-2x px-3'
                    },
                    {
                        tag: 'div',
                        innerHTML: description
                    },
                ]
            },
            { tag: 'hr', class: 'fv-color-primary' },
        ]
    }
}

function skeletonView(skeleton: SkeletonItem, parameters: Subject<{ [key: string]: any }>) {

    let subjects = skeleton.data.parameters.map(p => {
        let subject = new ReplaySubject<{ id, value }>(1)
        if (p.defaultValue != null)
            subject.next({ id: p.id, value: p.defaultValue })
        return subject
    })

    return {
        children: [
            descriptionView(skeleton.data.description),
            {
                children: skeleton.data.parameters.map((param, i) => {
                    return parameterView(param, subjects[i])
                })
            }
        ],
        connectedCallback: (elem) => {
            if(subjects.length==0){
                parameters.next( {parameters: {}})
                return 
            }
            elem.subscriptions.push(
                combineLatest(subjects).pipe(
                    map((params: Array<{ id, value }>) => {
                        return params.reduce((acc, e) => ({ ...acc, ...{ [e.id]: e.value } }), {})
                    })
                ).subscribe(p => {
                    parameters.next(p)
                })
            )
        }
    }
}

function parameterView(parameter: SkeletonParameters, value$: Subject<any>) {

    let expandedNode$ = new BehaviorSubject(false)
    let factory = {
        'string': {
            class: 'ml-2',
            tag: 'input',
            placeholder: parameter.placeholder,
            oninput: (ev) => value$.next({ id: parameter.id, value: ev.target.value })
        },
        'text': {
            tag: 'textarea',
            class: 'ml-2 w-100 flex-grow-1',
            placeholder: parameter.placeholder,
            oninput: (ev) => value$.next({ id: parameter.id, value: ev.target.value })
        },

    }
    return {
        children: [
            {
                class: 'd-flex align-items-center my-3',
                children: [
                    {
                        class: parameter.required ? 'fv-text-focus' : '',
                        innerText: parameter.displayName
                    },
                    {
                        class: 'fv-text-focus',
                        innerText: parameter.required ? '*' : ''
                    },
                    {
                        class: attr$(
                            expandedNode$,
                            (expanded) => expanded ? 'fv-text-focus' : '',
                            { wrapper: (d) => 'i fas fa-info fv-pointer mx-2 fv-hover-text-focus ' + d }
                        ),
                        onclick: () => expandedNode$.next(!expandedNode$.getValue())
                    },
                    {
                        ...factory[parameter.type],
                        ...(parameter.defaultValue ? { value: parameter.defaultValue } : {})
                    },

                ]
            },
            {
                class: attr$(
                    expandedNode$,
                    (expanded) => expanded ? 'd-block' : 'd-none',
                ),
                innerText: parameter.description
            }
        ]
    }
}