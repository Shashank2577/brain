import { type LoaderFunctionArgs } from "react-router";
export declare function meta(): ({
    title: string;
    name?: undefined;
    content?: undefined;
} | {
    name: string;
    content: string;
    title?: undefined;
})[];
export declare function loader({ request }: LoaderFunctionArgs): void;
export declare function clientLoader({ request }: LoaderFunctionArgs): void;
export declare function HydrateFallback(): import("react/jsx-runtime").JSX.Element;
export default function IndexPage(): any;
//# sourceMappingURL=_index.d.ts.map