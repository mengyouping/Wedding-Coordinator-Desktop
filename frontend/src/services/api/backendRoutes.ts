export const domainRoutes = [
  'settings', 'profile', 'budget', 'tasks', 'guests', 'tables', 'seat-assignments',
  'seating-plans', 'vendors', 'timeline', 'invitations', 'risks', 'materials', 'members',
  'attachments', 'quotes', 'contracts', 'transactions', 'runbook-events', 'check-ins',
  'incidents', 'conflicts', 'outbox', 'audit-logs'
] as const;

export type DomainRoute = typeof domainRoutes[number];

export const operationSectionRoutes = [
  'banquet-menus', 'banquet-menu-items', 'banquet-tastings', 'beverage-plans',
  'beverage-stock-movements', 'venue-layout', 'venue-elements', 'movement-routes',
  'staff-positions', 'responsibility-matrix', 'hospitality-services', 'vehicles',
  'accommodations', 'gift-distributions', 'ceremony-programs', 'ceremony-cues',
  'ceremony-media', 'vendor-deliveries', 'logistics-records', 'emergency-plans'
] as const;

export type OperationSectionRoute = typeof operationSectionRoutes[number];

const project = '/wedding/projects/{projectId}';
const domainTemplates = domainRoutes.flatMap(domain => [
  `${project}/${domain}`,
  `${project}/${domain}/{itemId}`
]);
const operationTemplates = operationSectionRoutes.flatMap(section => [
  `${project}/${section}`,
  `${project}/${section}/{itemId}`
]);

/** 前端允许访问的 Wedding Coordinator 后端路径事实清单。 */
export const backendRouteTemplates = [
  '/auth/login-url',
  '/auth/verify-token',
  '/auth/profile-url',
  '/wedding/projects',
  project,
  `${project}/snapshot`,
  `${project}/reset`,
  `${project}/dashboard`,
  `${project}/war-room`,
  `${project}/operations`,
  `${project}/tasks/{itemId}/complete`,
  `${project}/tasks/{itemId}/reopen`,
  `${project}/tasks/batch`,
  `${project}/quotes/{itemId}/select`,
  `${project}/contracts/{itemId}/activate`,
  `${project}/transactions/{itemId}/void`,
  `${project}/tables/{itemId}/lock`,
  `${project}/tables/{itemId}/unlock`,
  `${project}/seating-plans/{itemId}/activate`,
  `${project}/seating/auto-plan`,
  `${project}/invitations/{itemId}/regenerate-token`,
  `${project}/invitations/batch`,
  `${project}/invitations/statistics`,
  `${project}/risks/{itemId}/mitigations`,
  `${project}/materials/{itemId}/handover`,
  `${project}/materials/{itemId}/return`,
  `${project}/timeline/{itemId}/start`,
  `${project}/timeline/{itemId}/complete`,
  `${project}/timeline/{itemId}/skip`,
  `${project}/timeline/{itemId}/delay`,
  `${project}/outbox/{itemId}/retry`,
  `${project}/conflicts/{itemId}/resolve`,
  `${project}/attachments/presign`,
  `${project}/attachments/complete`,
  `${project}/attachments/{itemId}/download`,
  `${project}/attachments/{itemId}/grants`,
  `${project}/attachments/{itemId}/grants/{grantId}`,
  '/public/invitations/{token}',
  '/public/invitations/{token}/opened',
  '/public/invitations/{token}/rsvp',
  '/public/uploads/{token}',
  '/public/downloads/{token}',
  `${project}/vendor-deliveries/{itemId}/check-in`,
  `${project}/vendor-deliveries/{itemId}/accept`,
  `${project}/vendor-deliveries/{itemId}/check-out`,
  `${project}/logistics-records/{itemId}/handover`,
  `${project}/logistics-records/{itemId}/recover`,
  `${project}/emergency-plans/{itemId}/activate`,
  `${project}/emergency-plans/{itemId}/close`,
  ...domainTemplates,
  ...operationTemplates
].filter((path, index, values) => values.indexOf(path) === index);
