import { notFound } from "next/navigation";

// Tina throws when a sprint file does not exist. That is a 404; any other failure stays a 500.
export async function orNotFound<T>(query: Promise<T>): Promise<T> {
  try {
    return await query;
  } catch (error) {
    if (String(error).includes("Unable to find record")) notFound();
    throw error;
  }
}
