module default {
	type User {
		property name -> str;
		property email -> str {
			constraint exclusive;
		}
		property emailVerified -> datetime;
		property image -> str;
		property phone -> str;
		property role -> str;
		multi link accounts -> Account;
		multi link sessions -> Session;
	}

	type Account {
		property type -> str;
		property provider -> str;
		property providerAccountId -> str;
		property refresh_token -> str;
		property access_token -> str;
		property expires_at -> int64;
		property token_type -> str;
		property scope -> str;
		property id_token -> str;
		property session_state -> str;
		property userId -> str;

		# constraint exclusive on ((.provider, .providerAccountId));
	}

	type Session {
		required property sessionToken -> str {
			constraint exclusive;
		}
		required property expires -> datetime;
		required property userId -> str;
	}

	type VerificationToken {
		property identifier -> str;
		property token -> str {
			constraint exclusive;
		}
		property expires -> datetime;

		constraint exclusive on ((.identifier, .token));
	}
}
