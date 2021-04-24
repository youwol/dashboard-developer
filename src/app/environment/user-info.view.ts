import { attr$, child$, render, VirtualDOM } from "@youwol/flux-view";
import { ExpandableGroup, Modal } from "@youwol/fv-group";
import { Select } from "@youwol/fv-input";
import { BehaviorSubject, combineLatest, Observable, Subject } from "rxjs";
import { distinctUntilChanged, map, mergeMap, skip, withLatestFrom } from "rxjs/operators";
import { Backend } from "../backend";
import { button, descriptionView } from "../utils-view";
import { Environment } from "./models";


class State extends ExpandableGroup.State {

    constructor(public readonly environment : Environment
        ) {
        super("User info")
    }
}

function headerView(state: State): VirtualDOM {

    return {
        className: ExpandableGroup.defaultHeaderClass,
        children: [
            {
                tag: 'i',
                className: attr$(
                    state.expanded$,
                    d => d ? "fa-caret-down" : "fa-caret-right",
                    { wrapper: (d) => "px-2 fas " + d }
                )
            },
            {
                tag: 'i',
                class: 'fas fa-users'
            },
            {
                innerText: "User info",
                class: 'px-2',
                style: { 'font-size': 'large' }
            },
            {
                class: 'fv-text-focus px-2',
                children: [
                    {
                        innerText: `Logged as ${state.environment.userInfo.name}`
                    }
                ]
            }
        ]
    }
}

export function userInfoView(environment: Environment) {

    let items = environment.users.map(user => new Select.ItemData(user, user)) 
    
    let selected$ = new BehaviorSubject(environment.userInfo.email)    
    
    let selectState = new Select.State(items, selected$ )
    selectState.selectionId$.pipe(
        skip(1),
        distinctUntilChanged(),
        mergeMap( (id) => {
            return Backend.environment.login$({email:id}) 
        })
    ).subscribe(() => {})

    let btn = button('fas fa-plus', 'sync. user')
    btn.state.click$.subscribe(() => syncUserModal())

    let contentView = (state: State) => ({
        class: "border rounded fv-color-primary p-2",
        children: [
            descriptionView({
                tag: 'ul',
                innerText: `To better work with local YouWol it is preferable to sync your user info with your remotes account.
                It is required when:
                `,
                children:[
                    {tag:'li', innerText:'When pushing or pulling data'}
                ]
            }),
            {
                class: 'd-flex align-items-center',
                children: [
                    { innerText: 'Current user:' },
                    new Select.View({ state: selectState, class: 'mx-2' } as any),
                    btn,
                ]
            },
            {
                children: [
                    {   
                        tag:'ul',
                        innerText: 'Member of:',
                        children: environment.userInfo.memberOf.map(grp => {
                            return { tag: 'li', class: '', innerText: grp }
                        }) 
                    }
                ]
            }
        ]
    })
    return new ExpandableGroup.View(
        {
            state: new State(environment),
            headerView,
            contentView,
            className: 'my-2'
        } as any
    )
}

function syncUserModal() {

    let modalState = new Modal.State()

    let okBtn = button('', 'Sign-in')
    
    let email$ = new Subject<string>()
    let password$ = new Subject<string>()

    let modalContent = () => {
        return {
            class: 'fv-text-primary fv-bg-background-alt p-4 rounded border fv-color-primary',
            style: {'max-width': '500px'},
            children: [
                {
                    class: 'd-flex align-items-baseline py-2 text-center mx-auto justify-content-center',
                    children: [
                        {
                            tag: 'h4',
                            class: 'text-center fv-text-focus',
                            innerText: "Synchronize with remote user"
                        }
                    ]
                },
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
                            innerHTML: "Provide the email adress and password of the user for which you want to synchronize the profile. "+
                            " Please make sure your internet connection is turned on."
                        },
                    ]
                },
                { tag: 'hr', class: 'fv-color-primary' },
                {
                    class: 'd-flex align-items-baseline w-100',
                    children: [
                        {
                            tag: 'i', class: 'fas fa-at px-3'
                        },
                        {
                            tag: 'input', type: 'text', class: "flex-grow-1",
                            onchange: (ev)=>email$.next(ev.target.value)
                        }
                    ]
                },
                {
                    class: 'd-flex align-items-baseline w-100 my-2',
                    children: [
                        {
                            tag: 'i', class: 'fas fa-key px-3'
                        },
                        {
                            tag: 'input', type: 'password', class: "flex-grow-1",
                            onchange: (ev)=>password$.next(ev.target.value)
                        }
                    ]
                },
                {
                    class:'pt-3',
                    children:[
                        okBtn
                    ]
                }
            ]
        }
    }
    let view = new Modal.View({ state: modalState, contentView: modalContent })
    let div = render(view)
    document.body.appendChild(div)
    modalState.cancel$.subscribe(() => div.remove())
    okBtn.state.click$.pipe(
        withLatestFrom( combineLatest([email$, password$])),
        mergeMap( ([click, [email,password]]) => Backend.environment.syncUser$({email,password,remoteEnvironment:'dev.platform.youwol.com'}))
    )
        .subscribe((resp) => {
            console.log(resp)
            div.remove()
        })
}