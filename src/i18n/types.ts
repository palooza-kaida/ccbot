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
    alreadyConnected: string;
    connectionLost: string;
    connectionRestored: string;
    commands: {
      start: string;
    };
    viewDetails: string;
    open: string;
    sendFailed: string;
    sendFallbackFailed: string;
    firstTimeSetup: string;
    globalInstallTip: string;
    alreadyRunning: string;
    twowayEnabled: string;
    twowayDisabled: string;
  };
  setup: {
    intro: string;
    tokenMessage: string;
    tokenPlaceholder: string;
    tokenRequired: string;
    tokenInvalidFormat: string;
    verifyingToken: string;
    botVerified: string;
    scanOrClick: string;
    waitingForStart: string;
    userDetected: string;
    tokenVerifyFailed: string;
    waitingTimeout: string;
    cancelled: string;
    configSaved: string;
    hookInstalled: string;
    hookAlreadyInstalled: string;
    hookFailed: string;
    chatIdRegistered: string;
    complete: string;
    languageMessage: string;
    tokenUnchanged: string;
    selectAgents: string;
    agentNotInstalled: string;
    agentHookInstalled: string;
    agentHookAlreadyInstalled: string;
    agentHookUninstalled: string;
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
    agentHookRemoved: string;
  };
  update: {
    intro: string;
    npxAlreadyLatest: string;
    npxDone: string;
    checking: string;
    alreadyLatestNpm: string;
    alreadyLatestGit: string;
    updatingNpm: string;
    updating: string;
    updateSuccess: string;
    updateComplete: string;
    updateFailed: string;
    noUpdateNeeded: string;
    updateManualGlobal: string;
    pulling: string;
    pulled: string;
    pulledGit: string;
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
    stopEventFailed: string;
    sessionStartFailed: string;
  };
  tunnel: {
    installing: string;
    installed: string;
    started: string;
    failed: string;
    disconnected: string;
    exited: string;
    timeout: string;
  };
  config: {
    notFound: string;
    mustBeObject: string;
    invalidToken: string;
    invalidUserId: string;
    invalidPort: string;
    invalidSecret: string;
    invalidJson: string;
    invalidHookPort: string;
    hookAlreadyInstalled: string;
  };
  agent: {
    unknownAgent: string;
    taskDone: string;
  };
  common: {
    unknownCommand: string;
    setupFailed: string;
  };
  versionCheck: {
    updateAvailable: string;
    runToUpdate: string;
  };
  tmux: {
    notAvailable: string;
    scanComplete: string;
    sessionRegistered: string;
    sessionDiscovered: string;
    sessionLost: string;
    scanSummary: string;
    hookRepaired: string;
    hookReceived: string;
    noSessions: string;
  };
  chat: {
    placeholder: string;
    replyHint: string;
    sessionExpired: string;
    sessionNotFound: string;
    tmuxDead: string;
    sent: string;
    busy: string;
    desktopActive: string;
  };
}
