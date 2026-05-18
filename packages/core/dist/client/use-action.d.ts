import type { UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
/**
 * Action type registry. This interface is empty by default and gets augmented
 * by the auto-generated `.generated/action-types.d.ts` file. When augmented,
 * it maps action names to their parameter and return types, enabling
 * end-to-end type safety for `useActionQuery` and `useActionMutation`.
 */
export interface ActionRegistry {
}
/** Resolves to the union of registered action names, or `string` if no registry exists. */
type ActionName = keyof ActionRegistry extends never ? string : (keyof ActionRegistry & string) | (string & {});
/** Resolves the return type of an action, or `any` if not in the registry. */
type ActionResult<T extends string> = T extends keyof ActionRegistry ? ActionRegistry[T] extends {
    result: infer R;
} ? R : any : any;
/** Resolves the parameter type of an action, or `Record<string, any>` if not in the registry. */
type ActionParams<T extends string> = T extends keyof ActionRegistry ? ActionRegistry[T] extends {
    params: infer P;
} ? P : Record<string, any> : Record<string, any>;
/**
 * Query an action exposed as GET.
 *
 * When the action type registry is generated, the return type and parameter
 * types are inferred automatically from the action's `defineAction()` call.
 *
 * ```ts
 * // Type-safe — no manual generic needed
 * const { data } = useActionQuery("list-meals", { date: "2025-01-01" });
 *
 * // Manual override still works when needed
 * const { data } = useActionQuery<CustomType>("list-meals");
 * ```
 */
export declare function useActionQuery<TResult = undefined, TName extends ActionName = ActionName>(actionName: TName, params?: ActionParams<TName>, options?: Omit<UseQueryOptions<TResult extends undefined ? ActionResult<TName> : TResult>, "queryKey" | "queryFn">): import("@tanstack/react-query").UseQueryResult<import("@tanstack/react-query").NoInfer<TResult extends undefined ? ActionResult<TName> : TResult>, Error>;
/**
 * Mutate via an action exposed as POST (default), PUT, or DELETE.
 *
 * When the action type registry is generated, the return type and parameter
 * types are inferred automatically.
 *
 * ```ts
 * // Type-safe
 * const { mutate } = useActionMutation("log-meal");
 * mutate({ name: "Salad", calories: 350 });
 * ```
 */
export declare function useActionMutation<TData = undefined, TVariables = undefined, TName extends ActionName = ActionName>(actionName: TName, options?: Omit<UseMutationOptions<TData extends undefined ? ActionResult<TName> : TData, Error, TVariables extends undefined ? ActionParams<TName> : TVariables>, "mutationFn"> & {
    method?: "POST" | "PUT" | "DELETE";
}): import("@tanstack/react-query").UseMutationResult<TData extends undefined ? ActionResult<TName> : TData, Error, TVariables extends undefined ? ActionParams<TName> : TVariables, unknown>;
export {};
//# sourceMappingURL=use-action.d.ts.map