



export enum PanelId{
    ConfigurationGeneral = "conf.general",
    ConfigurationRawFile = "conf.raw-file",
    LocalEnvPackage = "local.packages",
    LocalEnvFronts = "local.fronts",
    LocalEnvBacks = "local.backs",
    LocalEnvCDN = "local.cdn",
    AssetsUploadPackages = "upload.packages",
    AssetsUploadFluxApps = "upload.fluxapps",
    AssetsUploadStories = "upload.stories",
    AssetsDownloadFluxApps = "download.fluxapps",
    AssetsUploadData = "upload.data",
    AssetsUploadPackage = "upload.AssetsUploadPackage",
    AssetsDownloadPackages = "download.packages",
}

export let tabsDisplayInfo = {
    [PanelId.ConfigurationGeneral]: { title: "General", enabled: true},
    [PanelId.ConfigurationRawFile]: { title: "Raw file", enabled: true},
    [PanelId.LocalEnvPackage]: { title: "Packages", enabled: true},
    [PanelId.LocalEnvFronts]: { title: "Front Ends", enabled: true},
    [PanelId.LocalEnvBacks]: { title: "Back Ends", enabled: true},
    [PanelId.LocalEnvCDN]: { title: "CDN", enabled: true},
    [PanelId.AssetsUploadPackages]: { title: "Packages", enabled: true},
    [PanelId.AssetsUploadFluxApps]: { title: "Flux apps", enabled: true},
    [PanelId.AssetsUploadData]: { title: "Data", enabled: true},
    [PanelId.AssetsDownloadFluxApps]: { title: "Flux apps", enabled: true},
    [PanelId.AssetsUploadData]: { title: "Data", enabled: true},
    [PanelId.AssetsDownloadPackages]: { title: "Packages", enabled: true},
    [PanelId.AssetsUploadStories]: { title: "Stories", enabled: true },
}

