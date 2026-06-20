import { AcquisitionProvider } from './types';
import { AsmrOneProvider } from './providers/asmrone';

/** Global provider registry */
const providers = new Map<string, AcquisitionProvider>();

/** Register a provider. Call once at startup. */
export function registerProvider(provider: AcquisitionProvider): void {
  if (providers.has(provider.id)) {
    throw new Error(`Provider "${provider.id}" already registered`);
  }
  providers.set(provider.id, provider);
}

/** Get a provider by ID */
export function getProvider(id: string): AcquisitionProvider | undefined {
  return providers.get(id);
}

/** List all registered providers */
export function listProviders(): AcquisitionProvider[] {
  const result: AcquisitionProvider[] = [];
  providers.forEach((p) => result.push(p));
  return result;
}

/** Find the first provider that supports the given input */
export function findProvider(input: string): AcquisitionProvider | undefined {
  let found: AcquisitionProvider | undefined;
  providers.forEach((p) => { if (!found && p.supports(input)) found = p; });
  return found;
}

// ─── Bootstrap: register built-in providers ─────────────

registerProvider(new AsmrOneProvider());
