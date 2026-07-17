export interface LayoutSettingsSyncPayload {
  scope?: 'header' | 'footer' | 'both';
  updatedAt: string;
}

export const LAYOUT_SETTINGS_STORAGE_KEY = 'sonpin-layout-settings-sync';
export const LAYOUT_SETTINGS_SYNC_EVENT = 'sonpin-layout-settings-sync';
export const LAYOUT_SETTINGS_BROADCAST_CHANNEL = 'sonpin-layout-settings-sync-channel';

const hasBrowser = () => typeof window !== 'undefined';

export const emitLayoutSettingsSync = (scope: LayoutSettingsSyncPayload['scope'] = 'both') => {
  if (!hasBrowser()) return;

  const payload: LayoutSettingsSyncPayload = {
    scope,
    updatedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(LAYOUT_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage write failures; event dispatch still handles same-tab sync.
  }

  window.dispatchEvent(new CustomEvent<LayoutSettingsSyncPayload>(LAYOUT_SETTINGS_SYNC_EVENT, { detail: payload }));

  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(LAYOUT_SETTINGS_BROADCAST_CHANNEL);
    channel.postMessage(payload);
    channel.close();
  }
};

export const subscribeLayoutSettingsSync = (handler: (payload: LayoutSettingsSyncPayload) => void) => {
  if (!hasBrowser()) return () => {};

  const onCustomEvent = (event: Event) => {
    const customEvent = event as CustomEvent<LayoutSettingsSyncPayload>;
    if (customEvent.detail) {
      handler(customEvent.detail);
    }
  };

  const onStorageEvent = (event: StorageEvent) => {
    if (event.key !== LAYOUT_SETTINGS_STORAGE_KEY || !event.newValue) return;

    try {
      const parsed = JSON.parse(event.newValue) as LayoutSettingsSyncPayload;
      if (parsed?.updatedAt) handler(parsed);
    } catch {
      // Ignore malformed sync payloads.
    }
  };

  window.addEventListener(LAYOUT_SETTINGS_SYNC_EVENT, onCustomEvent);
  window.addEventListener('storage', onStorageEvent);

  let channel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(LAYOUT_SETTINGS_BROADCAST_CHANNEL);
    channel.onmessage = (event) => {
      const payload = event.data as LayoutSettingsSyncPayload | undefined;
      if (payload?.updatedAt) {
        handler(payload);
      }
    };
  }

  return () => {
    window.removeEventListener(LAYOUT_SETTINGS_SYNC_EVENT, onCustomEvent);
    window.removeEventListener('storage', onStorageEvent);
    if (channel) {
      channel.close();
    }
  };
};
