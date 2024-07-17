-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" DATETIME,
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN,
    "locale" TEXT,
    "collaborator" BOOLEAN,
    "emailVerified" BOOLEAN
);

-- CreateTable
CREATE TABLE "GoogleApi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "apikey" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "UserConnection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "connection_id" TEXT,
    "uid" TEXT,
    "user_id" TEXT,
    "plan_id" TEXT,
    "custom_name" TEXT,
    "custom_note" TEXT,
    "sync_type" TEXT,
    "configured" BOOLEAN DEFAULT false,
    "is_sync_enabled" BOOLEAN DEFAULT false,
    "is_plugins_connected" BOOLEAN DEFAULT false,
    "config" TEXT,
    "created_at" DATETIME,
    "updated_at" DATETIME,
    "status" TEXT,
    "active_subscription_id" TEXT,
    "token" TEXT NOT NULL,
    "email" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "UserConnection_shop_key" ON "UserConnection"("shop");
