"use client";
import {
  mountPinpoint
} from "./chunk-SI7E6GTM.js";

// src/react.tsx
import { useEffect } from "react";
function Pinpoint(props) {
  useEffect(() => {
    const {
      dispose
    } = mountPinpoint(props);
    return dispose;
  }, []);
  return null;
}
export {
  Pinpoint
};
//# sourceMappingURL=react.js.map