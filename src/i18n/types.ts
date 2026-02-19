export interface TranslationKeys {
  bot: {
    started: string;
    shuttingDown: string;
    telegramStarted: string;
    commandsRegistered: string;
    commandsRegisterFailed: string;
    menuButtonRegistered: string;
    menuButtonFailed: string;
    noChatId: string;
    notificationFailed: string;
    registeredChatId: string;
    unauthorizedUser: string;
    ready: string;
    running: string;
    commands: {
      start: string;
      ping: string;
      status: string;
    };
  };
  setup: {
    intro: string;
    tokenMessage: string;
    tokenPlaceholder: string;
    tokenRequired: string;
    tokenInvalidFormat: string;
    userIdMessage: string;
    userIdPlaceholder: string;
    userIdRequired: string;
    userIdMustBeNumber: string;
    cancelled: string;
    configSaved: string;
    hookInstalled: string;
    hookAlreadyInstalled: string;
    hookFailed: string;
    chatIdRegistered: string;
    complete: string;
    languageMessage: string;
  };
  uninstall: {
    intro: string;
    hookRemoved: string;
    hookNotFound: string;
    configRemoved: string;
    configNotFound: string;
    removeGlobal: string;
    removeGitClone: string;
    done: string;
  };
  update: {
    intro: string;
    npxAlreadyLatest: string;
    npxDone: string;
    updating: string;
    updateSuccess: string;
    updateComplete: string;
    updateFailed: string;
    updateManualGlobal: string;
    pulling: string;
    pulled: string;
    installingDeps: string;
    depsInstalled: string;
    building: string;
    buildComplete: string;
    updateManualGit: string;
    gitRepoNotFound: string;
  };
  help: {
    intro: string;
    usage: string;
    commands: string;
    cmdNone: string;
    cmdSetup: string;
    cmdUpdate: string;
    cmdUninstall: string;
    cmdHelp: string;
    docs: string;
  };
  hook: {
    serverListening: string;
    invalidPayload: string;
    stopEventReceived: string;
    transcriptFailed: string;
    notificationFailed: string;
  };
  config: {
    notFound: string;
    readError: string;
    mustBeObject: string;
    invalidToken: string;
    invalidUserId: string;
    invalidPort: string;
    invalidSecret: string;
    invalidHookPort: string;
    hookAlreadyInstalled: string;
    readSettingsError: string;
  };
  notification: {
    title: string;
    changes: string;
  };
  common: {
    unknownCommand: string;
    setupFailed: string;
  };
}
