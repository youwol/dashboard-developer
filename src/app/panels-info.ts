



export enum PanelId{
    ConfigurationGeneral = "conf.general",
    ConfigurationRawFile = "conf.raw-file",
    LocalEnvPackage = "local.packages",
    LocalEnvFronts = "local.fronts",
    LocalEnvBacks = "local.backs",
    AssetsUploadPackages = "upload.packages",
    AssetsUploadFluxApp = "upload.fluxapp",
    AssetsUploadData = "upload.fluxdata",
    AssetsUploadPackage = "upload.AssetsUploadPackage",
}

export let tabsDisplayInfo = {
    [PanelId.ConfigurationGeneral]: { title: "General", enabled: true},
    [PanelId.ConfigurationRawFile]: { title: "Raw file", enabled: true},
    [PanelId.LocalEnvPackage]: { title: "Packages", enabled: true},
    [PanelId.LocalEnvFronts]: { title: "Front Ends", enabled: true},
    [PanelId.LocalEnvBacks]: { title: "Back Ends", enabled: true},
    [PanelId.AssetsUploadPackages]: { title: "Packages", enabled: true},
    [PanelId.AssetsUploadFluxApp]: { title: "Flux app", enabled: false},
    [PanelId.AssetsUploadData]: { title: "Data", enabled: false},
}

