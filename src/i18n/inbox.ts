// QA Inbox translations - Swedish (sv) and English (en)

export type InboxLanguage = 'sv' | 'en';

export const inboxTranslations = {
  en: {
    // Page titles
    inbox: 'Inbox',
    inboxDescription: 'Manage QA issues and system messages',
    
    // Stats
    unread: 'unread',
    inProgress: 'in progress',
    
    // Filters
    allStatuses: 'All statuses',
    unreadStatus: 'Unread',
    inProgressStatus: 'In Progress',
    resolvedStatus: 'Resolved',
    allPriorities: 'All priorities',
    critical: 'Critical',
    high: 'High',
    normal: 'Normal',
    
    // Empty state
    noMessages: 'No messages',
    noMessagesFiltered: 'No messages match your filters',
    allResolved: 'All QA issues have been resolved!',
    
    // Status labels
    statusUnread: 'Unread',
    statusInProgress: 'In Progress',
    statusResolved: 'Resolved',
    
    // Priority labels
    priorityCritical: 'Critical',
    priorityHigh: 'High',
    priorityNormal: 'Normal',
    
    // Actions
    back: 'Back',
    backToInbox: 'Back to Inbox',
    assignToMe: 'Assign to me',
    changeStatus: 'Change status',
    resolveProblem: 'Resolve problem',
    addUpdate: 'Add',
    sending: 'Sending...',
    saving: 'Saving...',
    
    // Message detail
    details: 'Details',
    resolved: 'Resolved',
    problemWas: 'The problem was:',
    weFixedBy: 'We fixed it by:',
    nowWorking: 'Now it works because:',
    testedOn: 'Tested on:',
    timeline: 'Timeline',
    addUpdatePlaceholder: 'Add an update...',
    actions: 'Actions',
    information: 'Information',
    type: 'Type',
    created: 'Created',
    updated: 'Updated',
    assigned: 'Assigned',
    checks: 'Checks',
    times: 'times',
    resolvedBy: 'Resolved by',
    unknown: 'unknown',
    system: 'System',
    
    // Resolve dialog
    resolveDialogTitle: 'Resolve the problem',
    resolveDialogDescription: 'Fill in all fields to mark the problem as resolved.',
    problemLabel: 'The problem was that…',
    problemPlaceholder: 'Describe what was wrong (at least 10 characters)',
    fixLabel: 'We fixed it by…',
    fixPlaceholder: 'Describe how you fixed the problem (at least 10 characters)',
    verificationLabel: 'Now it works because…',
    verificationPlaceholder: 'Describe how you verified it works (at least 10 characters)',
    testedOnLabel: 'Tested on:',
    selectPlatform: 'Select at least one platform',
    cancel: 'Cancel',
    markAsResolved: 'Mark as resolved',
    minChars: 'At least 10 characters',
    
    // Toasts
    assignedSuccess: 'Assigned',
    assignedDescription: 'You have assigned yourself this issue',
    statusUpdated: 'Status updated',
    updateAdded: 'Update added',
    issueResolved: 'Issue resolved!',
    resolvedDescription: 'The problem has been marked as resolved',
    error: 'Error',
    couldNotAssign: 'Could not assign the issue',
    couldNotUpdateStatus: 'Could not update status',
    couldNotAddUpdate: 'Could not add update',
    couldNotResolve: 'Could not resolve the issue',
    
    // System updates
    assignedAndStarted: 'Assigned and started',
    markedUnread: 'Marked as unread',
    markedInProgress: 'Marked as in progress',
    markedResolved: 'Marked as resolved',
    resolvedAndVerified: 'Resolved and verified on',
    
    // Language
    language: 'Language',
    translateContent: 'Translate',
    originalLanguage: 'Original:',
    writtenIn: 'Written in',
    
    // Date formatting
    ago: 'ago',
    messageNotFound: 'Message not found',
    loading: 'Loading...',
  },
  sv: {
    // Page titles
    inbox: 'Inbox',
    inboxDescription: 'Hantera QA-problem och systemmeddelanden',
    
    // Stats
    unread: 'olästa',
    inProgress: 'pågående',
    
    // Filters
    allStatuses: 'Alla statusar',
    unreadStatus: 'Olästa',
    inProgressStatus: 'Pågående',
    resolvedStatus: 'Lösta',
    allPriorities: 'Alla prioriteter',
    critical: 'Kritisk',
    high: 'Hög',
    normal: 'Normal',
    
    // Empty state
    noMessages: 'Inga meddelanden',
    noMessagesFiltered: 'Inga meddelanden matchar dina filter',
    allResolved: 'Alla QA-problem har lösts!',
    
    // Status labels
    statusUnread: 'Oläst',
    statusInProgress: 'Pågående',
    statusResolved: 'Löst',
    
    // Priority labels
    priorityCritical: 'Kritisk',
    priorityHigh: 'Hög',
    priorityNormal: 'Normal',
    
    // Actions
    back: 'Tillbaka',
    backToInbox: 'Tillbaka till Inbox',
    assignToMe: 'Tilldela mig',
    changeStatus: 'Ändra status',
    resolveProblem: 'Lös problemet',
    addUpdate: 'Lägg till',
    sending: 'Skickar...',
    saving: 'Sparar...',
    
    // Message detail
    details: 'Detaljer',
    resolved: 'Löst',
    problemWas: 'Problemet var att:',
    weFixedBy: 'Vi fixade det genom att:',
    nowWorking: 'Nu fungerar det eftersom:',
    testedOn: 'Testat på:',
    timeline: 'Tidslinje',
    addUpdatePlaceholder: 'Lägg till en uppdatering...',
    actions: 'Åtgärder',
    information: 'Information',
    type: 'Typ',
    created: 'Skapad',
    updated: 'Uppdaterad',
    assigned: 'Tilldelad',
    checks: 'Kontroller',
    times: 'gånger',
    resolvedBy: 'Löst av',
    unknown: 'okänd',
    system: 'System',
    
    // Resolve dialog
    resolveDialogTitle: 'Lös problemet',
    resolveDialogDescription: 'Fyll i alla fält för att markera problemet som löst.',
    problemLabel: 'Problemet var att…',
    problemPlaceholder: 'Beskriv vad som var fel (minst 10 tecken)',
    fixLabel: 'Vi fixade det genom att…',
    fixPlaceholder: 'Beskriv hur du löste problemet (minst 10 tecken)',
    verificationLabel: 'Nu fungerar det eftersom…',
    verificationPlaceholder: 'Beskriv hur du verifierade att det fungerar (minst 10 tecken)',
    testedOnLabel: 'Testat på:',
    selectPlatform: 'Välj minst en plattform',
    cancel: 'Avbryt',
    markAsResolved: 'Markera som löst',
    minChars: 'Minst 10 tecken',
    
    // Toasts
    assignedSuccess: 'Tilldelad',
    assignedDescription: 'Du har tilldelat dig själv detta ärende',
    statusUpdated: 'Status uppdaterad',
    updateAdded: 'Uppdatering tillagd',
    issueResolved: 'Ärendet löst!',
    resolvedDescription: 'Problemet har markerats som löst',
    error: 'Fel',
    couldNotAssign: 'Kunde inte tilldela ärendet',
    couldNotUpdateStatus: 'Kunde inte uppdatera status',
    couldNotAddUpdate: 'Kunde inte lägga till uppdatering',
    couldNotResolve: 'Kunde inte lösa ärendet',
    
    // System updates
    assignedAndStarted: 'Tilldelad och påbörjad',
    markedUnread: 'Markerad som oläst',
    markedInProgress: 'Markerad som pågående',
    markedResolved: 'Markerad som löst',
    resolvedAndVerified: 'Löst och verifierat på',
    
    // Language
    language: 'Språk',
    translateContent: 'Översätt',
    originalLanguage: 'Original:',
    writtenIn: 'Skrivet på',
    
    // Date formatting
    ago: 'sedan',
    messageNotFound: 'Meddelande hittades inte',
    loading: 'Laddar...',
  },
} as const;

export type InboxTranslationKey = keyof typeof inboxTranslations.en;

export function getInboxTranslation(lang: InboxLanguage, key: InboxTranslationKey): string {
  return inboxTranslations[lang][key] || inboxTranslations.en[key] || key;
}

export const languageNames: Record<InboxLanguage, string> = {
  en: 'English',
  sv: 'Svenska',
};
