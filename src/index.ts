import type { Client } from 'edgedb'
import type { Account } from 'next-auth'
import type { Adapter, AdapterUser, AdapterSession, VerificationToken } from 'next-auth/adapters'

import type edgeql from './dbschema/edgeql-js'

type EdgeQl = typeof edgeql

const userProperties = {
	id: true,
	name: true,
	email: true,
	emailVerified: true,
	image: true,
	phone: true,
	role: true,
}

const getUserByID = async (c: Client, e: EdgeQl, id: string): Promise<AdapterUser | null> => {
	const user = await e.select(e.User.assert_single(), (u) => ({
		...userProperties,
		filter: e.op(u.id, '=', e.uuid(id))
	})).run(c)

	if (!user) {
		return null
	}

	return user as AdapterUser
}

const getSessionByID = async (c: Client, e: EdgeQl, id: string): Promise<AdapterSession | null> => {
	const s = await e.select(e.Session.assert_single(), (s) => ({
		id: true,
		sessionToken: true,
		userId: true,
		expires: true,
		filter: e.op(s.id, '=', e.uuid(id))
	})).run(c)

	if (!s) return null
	if (!s.userId) return null
	if (!s.sessionToken) return null

	return s as AdapterSession
}

export function EdgeDBAdapter(c: Client, e: EdgeQl): Adapter {
	return {
		createUser: async (data) => {
			const row = await e.insert(e.User, data).run(c)

			const user = e.select(e.User.assert_single(), (u) => ({
				...userProperties,
				filter: e.op(u.id, '=', e.uuid(row.id))
			})).run(c)

			return user as Promise<AdapterUser>
		},
		getUser: async (id) => {
			return getUserByID(c, e, id)
		},
		getUserByEmail: async (email) => {
			const user = e.select(e.User.assert_single(), (u) => ({
				...userProperties,
				filter: e.op(u.email, '=', email)
			})).run(c)
		
			return user as Promise<AdapterUser | null>
		},
		getUserByAccount: async (account) => {			
			const acc = await e.select(e.Account.assert_single(), (a) => ({
				userId: true,
				filter: e.op(
					e.op(a.provider, '=', account.provider),
					'and',
					e.op(a.providerAccountId, '=', account.providerAccountId)
				)
			})).run(c)

			if (!acc || !acc.userId) {
				return null
			}

			return getUserByID(c, e, acc.userId)
		},
		updateUser: async (data) => {
			if (data.id === undefined) {
				throw new Error("Can't update user without id")
			}

			const row = await e.update(e.User, (u) => ({
				filter: e.op(u.id, '=', e.uuid(data.id as string)),
				set: {
					...data
				},
			})).run(c)

			if (!row) {
				throw new Error("User not found")
			}

			const u = await getUserByID(c, e, row.id)
			if (!u) throw new Error("Failed to get user")
			return u
		},
		deleteUser: async (id) => {
			e.delete(e.User, (u) => ({
				filter: e.op(u.id, '=', e.uuid(id))
			})).run(c)
		},
		linkAccount: async (data) => {
			const row = await e.insert(e.Account, data).run(c)
			
			const acc = e.select(e.Account.assert_single(), a => ({
				type: true,
				provider: true,
				providerAccountId: true,
				refresh_token: true,
				access_token: true,
				expires_at: true,
				token_type: true,
				scope: true,
				id_token: true,
				session_state: true,
				userId: true,

				filter: e.op(a.id, '=', e.uuid(row.id))
			})).run(c)

			return acc as Promise<Account>
		},
		unlinkAccount: async (data) => {
			
		},
		getSessionAndUser: async (sessionToken) => {
			const session = await e.select(e.Session.assert_single(), (s) => ({
				id: true,
				sessionToken: true,
				expires: true,
				userId: true,
				filter: e.op(s.sessionToken, '=', sessionToken),
			})).run(c)

			if (!session || !session.id || !session.expires || !session.userId || !session.sessionToken) {
				return null
			}

			if (session.sessionToken === null) return null
			if (session.expires === null) return null
			
			const user = await getUserByID(c, e, session.userId)
			
			if (!user) {
				return null
			}

			return {
				session: session as AdapterSession,  // TODO: fix this
				user: user
			}
		},
		createSession: async (data) => {
			const row = await e.insert(e.Session, data).run(c)
			const s = await getSessionByID(c, e, row.id)
			if (!s) {
				throw new Error("Failed to create session")
			}

			return s
		},
		updateSession: async (data) => {
			const row = await e.update(e.Session, (s) => ({
				filter: e.op(s.sessionToken, '=', data.sessionToken),
				set: {
					...data
				},
			})).run(c)

			if (!row) return null

			const u = getSessionByID(c, e, row.id)
			if (!u) throw new Error("Failed to get session")
			return u
		},
		deleteSession: async (sessionToken) => {
			e.delete(e.Session, (s) => ({
				filter: e.op(s.sessionToken, '=', sessionToken)
			})).run(c)
		},
		createVerificationToken: async (data) => {
			const row = await e.insert(e.VerificationToken, data).run(c)
			const vt = await e.select(e.VerificationToken.assert_single(), (vt) => ({
			identifier: true,
			token: true,
				expires: true,
				filter: e.op(vt.id, '=', e.uuid(row.id))
			})).run(c)

			if (!vt) {
				throw new Error("Failed to create verification token")
			}

			return vt as VerificationToken
		},
		useVerificationToken: async (token) => {
			// select then delete
			const vToken = await e.select(e.VerificationToken.assert_single(), (vt) => ({
				id: true,
				identifier: true,
				token: true,
				expires: true,
				filter: e.op(
					e.op(vt.token, '=', token.token),
					'and',
					e.op(vt.identifier, '=', token.identifier)
				)
			})).run(c)

			if (!vToken) {
				return null
			}

			e.delete(e.VerificationToken, (vt) => ({
				filter: e.op(vt.id, '=', e.uuid(vToken.id))
			})).run(c)

			return vToken as VerificationToken
		}
	}
}