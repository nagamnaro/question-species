/** True when Supabase/PostgREST has not applied a migration yet (table/RPC missing). */
export function isMissingSchemaError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("could not find the table") ||
    lower.includes("does not exist") ||
    lower.includes("schema cache") ||
    lower.includes("could not find the function")
  );
}
