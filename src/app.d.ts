import { SupabaseClient, Session, User } from '@supabase/supabase-js';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			session: Session | null;
			user: User | null;
			profile: { role: 'Admin' | 'Organiser' | 'FrontDesk'; id: string; full_name?: string } | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export { };
