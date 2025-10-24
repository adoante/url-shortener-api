import {
	createServerClient,
	parseCookieHeader,
	serializeCookieHeader,
} from '@supabase/ssr'
import type { Request, Response } from 'express'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from "./types/database.types.js"

interface Context {
	req: Request
	res: Response
}

/**
 * Create a Supabase server client for Express (v0.7+ API)
 */
export function createClient(context: Context): SupabaseClient {
	return createServerClient<Database>(
		process.env.SUPABASE_URL as string,
		process.env.SUPABASE_ANON_KEY as string,
		{
			cookies: {
				async getAll() {
					// Return a Promise<{ name: string; value: string }[] | null>
					const parsed = parseCookieHeader(context.req.headers.cookie ?? '')
					// Ensure all cookies have a defined value (Supabase types require it)
					return parsed?.map((c) => ({
						name: c.name,
						value: c.value ?? '',
					})) ?? []
				},
				async setAll(cookiesToSet) {
					cookiesToSet?.forEach(({ name, value, options }) => {
						context.res.appendHeader(
							'Set-Cookie',
							serializeCookieHeader(name, value, options)
						)
					})
				},
			},
		}
	)
}
