CREATE MIGRATION m1qxlzrrjfgunqxvkd66unfiutb4g4cgtz43p34anloazi2pbpg74a
    ONTO initial
{
  CREATE FUTURE nonrecursive_access_policies;
  CREATE TYPE default::Account {
      CREATE PROPERTY access_token -> std::str;
      CREATE PROPERTY expires_at -> std::int64;
      CREATE PROPERTY id_token -> std::str;
      CREATE PROPERTY provider -> std::str;
      CREATE PROPERTY providerAccountId -> std::str;
      CREATE PROPERTY refresh_token -> std::str;
      CREATE PROPERTY scope -> std::str;
      CREATE PROPERTY session_state -> std::str;
      CREATE PROPERTY token_type -> std::str;
      CREATE PROPERTY type -> std::str;
      CREATE PROPERTY userId -> std::str;
  };
  CREATE TYPE default::Session {
      CREATE REQUIRED PROPERTY expires -> std::datetime;
      CREATE REQUIRED PROPERTY sessionToken -> std::str {
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE REQUIRED PROPERTY userId -> std::str;
  };
  CREATE TYPE default::User {
      CREATE MULTI LINK accounts -> default::Account;
      CREATE MULTI LINK sessions -> default::Session;
      CREATE PROPERTY email -> std::str {
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE PROPERTY emailVerified -> std::datetime;
      CREATE PROPERTY image -> std::str;
      CREATE PROPERTY name -> std::str;
      CREATE PROPERTY phone -> std::str;
      CREATE PROPERTY role -> std::str;
  };
  CREATE TYPE default::VerificationToken {
      CREATE PROPERTY identifier -> std::str;
      CREATE PROPERTY token -> std::str {
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE CONSTRAINT std::exclusive ON ((.identifier, .token));
      CREATE PROPERTY expires -> std::datetime;
  };
};
