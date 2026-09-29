/**
 * CRM Connector Registry
 *
 * Strategy-pattern registry for looking up connector implementations.
 * Phase 1A provides the registry shell. Phase 1B registers the GHL adapter,
 * and Phase 1C registers the Square adapter.
 */

import type { CRMConnector, CRMConnectorConfig, CRMPlatform } from "./types.js";

export type ConnectorFactory = (config: CRMConnectorConfig) => CRMConnector;

type ConnectorEntry = {
  platform: CRMPlatform;
  factory: ConnectorFactory;
};

const registry = new Map<CRMPlatform, ConnectorEntry>();

/**
 * Register a connector factory for a platform. Called once at startup
 * or during adapter initialization.
 */
export function registerConnector(platform: CRMPlatform, factory: ConnectorFactory): void {
  if (registry.has(platform)) {
    throw new Error(`Connector for platform "${platform}" is already registered`);
  }
  registry.set(platform, { platform, factory });
}

/**
 * Look up a connector factory by platform. Returns undefined if the
 * adapter has not been implemented/registered yet.
 */
export function getConnectorFactory(platform: CRMPlatform): ConnectorFactory | undefined {
  return registry.get(platform)?.factory;
}

/**
 * Returns a connector instance for the requested platform and config.
 * Throws if the platform is unsupported or not yet implemented.
 */
export function createConnector(platform: CRMPlatform, config: CRMConnectorConfig): CRMConnector {
  const factory = getConnectorFactory(platform);
  if (!factory) {
    throw new Error(`No connector registered for platform "${platform}"`);
  }
  return factory(config);
}

/**
 * List platforms with registered adapters. Useful for the GET /crm/providers
 * metadata endpoint.
 */
export function listRegisteredPlatforms(): CRMPlatform[] {
  return Array.from(registry.keys());
}

/**
 * Clear the registry. Primarily for tests.
 */
export function resetRegistry(): void {
  registry.clear();
}
