/**
 * <DemoModeSection /> — toggle that replaces names, emails, and numbers with
 * realistic fake data everywhere (UI + what the agent sees) while preserving
 * IDs and structure so the app keeps working.
 *
 * The toggle is stored in application_state under `demo-mode`
 * (`{ enabled: boolean }`) and written via `PUT
 * /_agent-native/application-state/demo-mode` (optimistic — flip first,
 * write in the background). It READS from `/_agent-native/demo/status`
 * instead, which ORs the per-user toggle with the `DEMO_MODE` env: a hosted
 * demo deployment is forced on and the switch is locked so it can't be
 * accidentally turned off on stage.
 */
export declare function DemoModeSection(): import("react/jsx-runtime").JSX.Element;
export declare function DemoModeIcon(): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=DemoModeSection.d.ts.map