import { h as PinpointConfig } from './index-NvFcZ4SO.js';

/** Props for the <Pinpoint /> component. Same as PinpointConfig minus target. */
type PinpointProps = Omit<PinpointConfig, "target">;
/**
 * Mount the Pinpoint overlay as a React component.
 *
 * ```tsx
 * import { Pinpoint } from "@agent-native/pinpoint/react";
 *
 * function App() {
 *   return (
 *     <>
 *       <Pinpoint author="Designer" endpoint="/api/pins" autoSubmit />
 *       <YourApp />
 *     </>
 *   );
 * }
 * ```
 */
declare function Pinpoint(props: PinpointProps): null;

export { Pinpoint, type PinpointProps };
