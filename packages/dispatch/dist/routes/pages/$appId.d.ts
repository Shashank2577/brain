import { type ClientLoaderFunctionArgs, type LoaderFunctionArgs } from "react-router";
export declare function meta(): {
    title: string;
}[];
export declare function loader({ params }: LoaderFunctionArgs): any;
export declare function clientLoader({ params, serverLoader, }: ClientLoaderFunctionArgs): Promise<unknown>;
export default function WorkspaceAppCatchAllRoute(): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=$appId.d.ts.map