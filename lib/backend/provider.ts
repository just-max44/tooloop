const customApiBaseUrl = process.env.EXPO_PUBLIC_CUSTOM_API_BASE_URL?.trim();

export const isBackendConfigured = Boolean(customApiBaseUrl);