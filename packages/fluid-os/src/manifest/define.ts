import type { AppManifest, CapabilityDef, CapabilityMap } from "./types.js";

export function defineApp<C extends CapabilityMap>(spec: AppManifest<C>): AppManifest<C> {
  if (!/^[a-z][a-z0-9-]*$/.test(spec.id)) {
    throw new Error(`Invalid app id "${spec.id}": must be lower-kebab, start with a letter`);
  }
  for (const capId of Object.keys(spec.capabilities)) {
    if (!/^[a-z][a-z0-9-]*$/.test(capId)) {
      throw new Error(`Invalid capability id "${spec.id}.${capId}": must be lower-kebab`);
    }
  }
  return spec;
}

export function defineCapability<I, O>(def: CapabilityDef<I, O>): CapabilityDef<I, O> {
  return def;
}
