/**
 * Drizzle ORM Modular Schema Barrel
 *
 * All domain tables and relation definitions are organized into modular domains
 * under `./tables/*` while maintaining 100% backward compatibility for all imports.
 */

export * from "./tables/auth";
export * from "./tables/profiles";
export * from "./tables/listings";
export * from "./tables/offers";
export * from "./tables/engagements";
export * from "./tables/communication";
export * from "./tables/governance";
export * from "./relations";
