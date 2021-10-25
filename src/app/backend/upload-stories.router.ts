import { BehaviorSubject, combineLatest, ReplaySubject, Subject } from "rxjs"
import { map, scan, take } from "rxjs/operators"
import { createObservableFromFetch } from "./router"
import { TreeItem } from "./shared-models"


export enum StatusEnum {

    NOT_FOUND = 'StoryStatus.NOT_FOUND',
    SYNC = 'StoryStatus.SYNC',
    MISMATCH = 'StoryStatus.MISMATCH',
    PROCESSING = 'StoryStatus.PROCESSING',
    DONE = 'StoryStatus.DONE'
}

export class StoryStatus {
    constructor() { }
}

export class ResolvedStories extends StoryStatus {

    fluxStatus: StatusEnum
    treeStatus: StatusEnum
    assetStatus: StatusEnum

    constructor({ fluxStatus, treeStatus, assetStatus }) {
        super()
        this.fluxStatus = fluxStatus
        this.treeStatus = treeStatus
        this.assetStatus = assetStatus
    }
}
export class ProcessingStories extends StoryStatus {
}

export class Story {

    assetId: string
    rawId: string
    name: string
    treeItems: Array<TreeItem>
    status: StoryStatus

    constructor({
        assetId,
        name,
        treeItems,
        status
    }) {
        this.assetId = assetId
        this.name = name
        this.treeItems = treeItems
        this.status = (typeof (status) == 'string')
            ? new ProcessingStories()
            : new ResolvedStories(status)

    }
}


export class UploadStoriesRouter {

    private static urlBase = '/admin/upload/stories'
    private static webSocket$: Subject<any>

    static headers = {}

    static stories$ = new BehaviorSubject<{ [key: string]: Story }>({})
    static story$ = new ReplaySubject<Story>(1)


    static connectWs() {

        if (UploadStoriesRouter.webSocket$)
            return UploadStoriesRouter.webSocket$

        UploadStoriesRouter.webSocket$ = new Subject()
        var ws = new WebSocket(`ws://${window.location.host}${UploadStoriesRouter.urlBase}/ws`);

        ws.onmessage = (event) => {
            let data = JSON.parse(event.data)

            UploadStoriesRouter.webSocket$.next(data)
            if (data.target && data.target == 'story')
                UploadStoriesRouter.story$.next(new Story(data))

        };

        this.story$.pipe(
            scan((acc, e) => {
                if (e == undefined)
                    return {}
                return { ...acc, ...{ [e.assetId]: e } }
            }, {})
        ).subscribe((state) => {
            this.stories$.next(state)
        })

        return UploadStoriesRouter.webSocket$
    }

    static status$() {
        this.story$.next(undefined)
        let url = `${UploadStoriesRouter.urlBase}/status`
        let request = new Request(url, { method: 'GET', headers: UploadStoriesRouter.headers })
        let status$ = combineLatest([
            UploadStoriesRouter.webSocket$.pipe(take(1)),
            createObservableFromFetch(request)
        ]).pipe(
            map(([_, status]) => status)
        )
        return status$
    }

    static publish$(assetId: string) {

        let url = `${UploadStoriesRouter.urlBase}/publish/${assetId}`
        let request = new Request(url, { method: 'POST', headers: UploadStoriesRouter.headers })
        return createObservableFromFetch(request)
    }
}
