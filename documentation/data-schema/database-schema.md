# Maybe App - Complete Database Schema

> **Purpose**: This document provides a comprehensive database schema for recreating the Maybe personal finance management app in Supabase/PostgreSQL.

## Table of Contents

1. [Database Setup](#database-setup)
2. [Schema Overview](#schema-overview)
3. [Core Tables](#core-tables)
4. [Account System](#account-system)
5. [Transaction System](#transaction-system)
6. [Balance Tracking](#balance-tracking)
7. [Investments](#investments)
8. [Categorization & Organization](#categorization--organization)
9. [Budgeting](#budgeting)
10. [Transfers](#transfers)
11. [Automation - Rules](#automation---rules)
12. [Plaid Integration](#plaid-integration)
13. [Import & Export](#import--export)
14. [Sync Management](#sync-management)
15. [Exchange Rates](#exchange-rates)
16. [API & Authentication](#api--authentication)
17. [AI Features](#ai-features)
18. [Access & Invitations](#access--invitations)
19. [File Storage](#file-storage)
20. [Migration Guide](#migration-guide)

---

## Database Setup

### Required PostgreSQL Extensions

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable procedural language
CREATE EXTENSION IF NOT EXISTS "plpgsql";
```

### Custom Enum Types

```sql
-- Account synchronization status
CREATE TYPE account_status AS ENUM ('ok', 'syncing', 'error');
```

---

## Schema Overview

The Maybe app uses:
- **UUID primary keys** for all tables (except OAuth tables)
- **Polymorphic associations** for flexible entity relationships
- **Virtual/computed columns** for derived data
- **JSONB columns** for flexible metadata storage
- **Multi-tenant architecture** via family grouping
- **Comprehensive indexing** for performance
- **Foreign key constraints** with appropriate cascade behavior

### Key Architectural Patterns

1. **Polymorphic Accounts**: One `accounts` table with polymorphic `accountable_type/accountable_id` linking to 9 different account types (Depository, Investment, Crypto, Property, Vehicle, OtherAsset, CreditCard, Loan, OtherLiability)

2. **Polymorphic Entries**: One `entries` table with polymorphic `entryable_type/entryable_id` linking to 3 entry types (Transaction, Valuation, Trade)

3. **Multi-tenancy**: All user data scoped to `family_id` for household grouping

4. **Sync Tracking**: Comprehensive sync system for background job management

---

## Core Tables

### families

**Purpose**: Multi-tenant organization unit for grouping users, accounts, and financial data

```sql
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR,
    currency VARCHAR DEFAULT 'USD',
    locale VARCHAR DEFAULT 'en',
    country VARCHAR DEFAULT 'US',
    timezone VARCHAR,
    date_format VARCHAR DEFAULT '%m-%d-%Y',
    stripe_customer_id VARCHAR,
    data_enrichment_enabled BOOLEAN DEFAULT false,
    early_access BOOLEAN DEFAULT false,
    auto_sync_on_login BOOLEAN NOT NULL DEFAULT true,
    latest_sync_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    latest_sync_completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
-- None required beyond primary key
```

**Relationships:**
- has_many: users, accounts, categories, tags, merchants, budgets, rules, plaid_items

---

### users

**Purpose**: User accounts with authentication and preferences

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id),
    email VARCHAR UNIQUE NOT NULL,
    password_digest VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    role VARCHAR NOT NULL DEFAULT 'member', -- member, admin, super_admin
    active BOOLEAN NOT NULL DEFAULT true,
    onboarded_at TIMESTAMP,
    unconfirmed_email VARCHAR,
    otp_secret VARCHAR,
    otp_required BOOLEAN NOT NULL DEFAULT false,
    otp_backup_codes TEXT[] DEFAULT '{}',
    show_sidebar BOOLEAN DEFAULT true,
    show_ai_sidebar BOOLEAN DEFAULT true,
    ai_enabled BOOLEAN NOT NULL DEFAULT false,
    theme VARCHAR DEFAULT 'system', -- light, dark, system
    default_period VARCHAR NOT NULL DEFAULT 'last_30_days',
    rule_prompts_disabled BOOLEAN DEFAULT false,
    rule_prompt_dismissed_at TIMESTAMP,
    goals TEXT[] DEFAULT '{}',
    set_onboarding_preferences_at TIMESTAMP,
    set_onboarding_goals_at TIMESTAMP,
    last_viewed_chat_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_otp_secret ON users(otp_secret) WHERE otp_secret IS NOT NULL;
CREATE INDEX idx_users_family_id ON users(family_id);
CREATE INDEX idx_users_last_viewed_chat ON users(last_viewed_chat_id);
```

**Relationships:**
- belongs_to: family
- has_many: sessions, chats, api_keys

---

### sessions

**Purpose**: User session tracking for authentication

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    user_agent VARCHAR,
    ip_address VARCHAR,
    active_impersonator_session_id UUID,
    subscribed_at TIMESTAMP,
    prev_transaction_page_params JSONB DEFAULT '{}',
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
```

---

## Account System

### accounts (Polymorphic Parent)

**Purpose**: Universal account container supporting multiple account types via polymorphism

```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id),
    name VARCHAR,
    subtype VARCHAR,
    accountable_type VARCHAR NOT NULL, -- Depository, Investment, Crypto, Property, Vehicle, OtherAsset, CreditCard, Loan, OtherLiability
    accountable_id UUID NOT NULL,
    balance NUMERIC(19,4),
    cash_balance NUMERIC(19,4) DEFAULT 0.0,
    currency VARCHAR,
    classification VARCHAR GENERATED ALWAYS AS (
        CASE
            WHEN accountable_type IN ('Loan', 'CreditCard', 'OtherLiability') THEN 'liability'
            ELSE 'asset'
        END
    ) STORED,
    status VARCHAR DEFAULT 'active', -- active, draft, disabled, pending_deletion
    import_id UUID,
    plaid_account_id UUID,
    locked_attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_accounts_family_id ON accounts(family_id);
CREATE INDEX idx_accounts_accountable ON accounts(accountable_type, accountable_id);
CREATE INDEX idx_accounts_currency ON accounts(currency);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_accounts_family_type ON accounts(family_id, accountable_type);
CREATE INDEX idx_accounts_family_status ON accounts(family_id, status);
```

**Relationships:**
- belongs_to: family
- has_many: entries, balances, holdings (for investment accounts)
- delegated_type: accountable (polymorphic)

---

### depositories

**Purpose**: Cash accounts (checking, savings, money market)

```sql
CREATE TABLE depositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    locked_attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Valid Subtypes**: checking, savings, hsa, cd, money_market

---

### investments

**Purpose**: Investment accounts (brokerage, retirement, 401k)

```sql
CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    locked_attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Valid Subtypes**: brokerage, pension, retirement, 401k, roth_401k, 529_plan, hsa, mutual_fund, ira, roth_ira, angel

---

### cryptos

**Purpose**: Cryptocurrency holdings

```sql
CREATE TABLE cryptos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    locked_attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

### properties

**Purpose**: Real estate holdings

```sql
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_built INTEGER,
    area_value INTEGER,
    area_unit VARCHAR, -- sq ft, sq m, etc.
    locked_attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

### vehicles

**Purpose**: Vehicle assets

```sql
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER,
    make VARCHAR,
    model VARCHAR,
    mileage_value INTEGER,
    mileage_unit VARCHAR, -- miles, km
    locked_attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

### other_assets

**Purpose**: Miscellaneous assets

```sql
CREATE TABLE other_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    locked_attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

### credit_cards

**Purpose**: Credit card liabilities

```sql
CREATE TABLE credit_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    available_credit NUMERIC(10,2),
    minimum_payment NUMERIC(10,2),
    apr NUMERIC(10,2),
    expiration_date DATE,
    annual_fee NUMERIC(10,2),
    locked_attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

### loans

**Purpose**: Loan liabilities (mortgage, student, auto, etc.)

```sql
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rate_type VARCHAR, -- fixed, variable
    interest_rate NUMERIC(10,3),
    term_months INTEGER,
    initial_balance NUMERIC(19,4),
    locked_attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

### other_liabilities

**Purpose**: Miscellaneous liabilities

```sql
CREATE TABLE other_liabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    locked_attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## Transaction System

### entries (Polymorphic Parent)

**Purpose**: Universal entry container for all account transactions and valuations

```sql
CREATE TABLE entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    entryable_type VARCHAR NOT NULL, -- Transaction, Valuation, Trade
    entryable_id UUID NOT NULL,
    date DATE,
    name VARCHAR NOT NULL,
    amount NUMERIC(19,4) NOT NULL, -- positive = expense, negative = income
    currency VARCHAR,
    excluded BOOLEAN DEFAULT false,
    notes TEXT,
    plaid_id VARCHAR,
    import_id UUID,
    locked_attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_entries_account_id ON entries(account_id);
CREATE INDEX idx_entries_date ON entries(date);
CREATE INDEX idx_entries_entryable ON entries(entryable_type, entryable_id);
CREATE INDEX idx_entries_account_date ON entries(account_id, date DESC);
CREATE INDEX idx_entries_name_lower ON entries(LOWER(name));
```

**Relationships:**
- belongs_to: account
- delegated_type: entryable (polymorphic)

---

### transactions

**Purpose**: Regular account transactions (purchases, income, transfers)

```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID,
    merchant_id UUID,
    kind VARCHAR NOT NULL DEFAULT 'standard', -- standard, funds_movement, cc_payment, loan_payment, one_time
    locked_attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX idx_transactions_kind ON transactions(kind);
```

**Transaction Kinds:**
- `standard`: Regular transaction (included in budgets)
- `funds_movement`: Transfer between accounts
- `cc_payment`: Credit card payment
- `loan_payment`: Loan payment
- `one_time`: One-time transaction (excluded from budgets)

---

### valuations

**Purpose**: Account balance snapshots and reconciliations

```sql
CREATE TABLE valuations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind VARCHAR NOT NULL DEFAULT 'reconciliation', -- reconciliation, opening_anchor, current_anchor
    locked_attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

### trades

**Purpose**: Investment buy/sell transactions

```sql
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    security_id UUID NOT NULL,
    qty NUMERIC(19,4), -- negative = sell
    price NUMERIC(19,4),
    currency VARCHAR,
    locked_attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_trades_security_id ON trades(security_id);
```

---

## Balance Tracking

### balances

**Purpose**: Daily account balance snapshots with calculated flows

```sql
CREATE TABLE balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    balance NUMERIC(19,4) NOT NULL, -- deprecated, use virtual columns
    currency VARCHAR NOT NULL DEFAULT 'USD',
    cash_balance NUMERIC(19,4) DEFAULT 0.0,
    start_cash_balance NUMERIC(19,4) NOT NULL DEFAULT 0.0,
    start_non_cash_balance NUMERIC(19,4) NOT NULL DEFAULT 0.0,
    cash_inflows NUMERIC(19,4) NOT NULL DEFAULT 0.0,
    cash_outflows NUMERIC(19,4) NOT NULL DEFAULT 0.0,
    non_cash_inflows NUMERIC(19,4) NOT NULL DEFAULT 0.0,
    non_cash_outflows NUMERIC(19,4) NOT NULL DEFAULT 0.0,
    net_market_flows NUMERIC(19,4) NOT NULL DEFAULT 0.0,
    cash_adjustments NUMERIC(19,4) NOT NULL DEFAULT 0.0,
    non_cash_adjustments NUMERIC(19,4) NOT NULL DEFAULT 0.0,
    flows_factor INTEGER NOT NULL DEFAULT 1, -- 1 or -1
    start_balance NUMERIC(19,4) GENERATED ALWAYS AS (start_cash_balance + start_non_cash_balance) STORED,
    end_cash_balance NUMERIC(19,4) GENERATED ALWAYS AS (
        start_cash_balance + (cash_inflows - cash_outflows) * flows_factor + cash_adjustments
    ) STORED,
    end_non_cash_balance NUMERIC(19,4) GENERATED ALWAYS AS (
        start_non_cash_balance + (non_cash_inflows - non_cash_outflows) * flows_factor + net_market_flows + non_cash_adjustments
    ) STORED,
    end_balance NUMERIC(19,4) GENERATED ALWAYS AS (
        start_cash_balance + (cash_inflows - cash_outflows) * flows_factor + cash_adjustments +
        start_non_cash_balance + (non_cash_inflows - non_cash_outflows) * flows_factor + net_market_flows + non_cash_adjustments
    ) STORED,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, date, currency)
);
```

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_balances_account_date_currency ON balances(account_id, date, currency);
CREATE INDEX idx_balances_account_id ON balances(account_id);
CREATE INDEX idx_balances_account_date_desc ON balances(account_id, date DESC);
```

---

### holdings

**Purpose**: Investment account holdings snapshots

```sql
CREATE TABLE holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    security_id UUID NOT NULL,
    date DATE NOT NULL,
    qty NUMERIC(19,4) NOT NULL,
    price NUMERIC(19,4) NOT NULL,
    amount NUMERIC(19,4) NOT NULL, -- qty * price
    currency VARCHAR NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, security_id, date, currency)
);
```

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_holdings_account_security_date ON holdings(account_id, security_id, date, currency);
CREATE INDEX idx_holdings_account_id ON holdings(account_id);
CREATE INDEX idx_holdings_security_id ON holdings(security_id);
```

---

## Investments

### securities

**Purpose**: Stocks, ETFs, mutual funds, and other tradable securities

```sql
CREATE TABLE securities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker VARCHAR NOT NULL,
    name VARCHAR,
    country_code VARCHAR,
    exchange_mic VARCHAR,
    exchange_acronym VARCHAR,
    exchange_operating_mic VARCHAR,
    logo_url VARCHAR,
    offline BOOLEAN NOT NULL DEFAULT false,
    failed_fetch_at TIMESTAMP,
    failed_fetch_count INTEGER NOT NULL DEFAULT 0,
    last_health_check_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_securities_ticker_exchange ON securities(UPPER(ticker), COALESCE(UPPER(exchange_operating_mic), ''));
CREATE INDEX idx_securities_country ON securities(country_code);
CREATE INDEX idx_securities_exchange ON securities(exchange_operating_mic);
```

---

### security_prices

**Purpose**: Historical security prices

```sql
CREATE TABLE security_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    security_id UUID REFERENCES securities(id),
    date DATE NOT NULL,
    price NUMERIC(19,4) NOT NULL,
    currency VARCHAR NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(security_id, date, currency)
);
```

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_security_prices_security_date ON security_prices(security_id, date, currency);
CREATE INDEX idx_security_prices_security_id ON security_prices(security_id);
```

---

## Categorization & Organization

### categories

**Purpose**: Transaction categorization (hierarchical, 2 levels max)

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id),
    parent_id UUID REFERENCES categories(id),
    name VARCHAR NOT NULL,
    color VARCHAR NOT NULL DEFAULT '#6172F3',
    lucide_icon VARCHAR NOT NULL DEFAULT 'shapes',
    classification VARCHAR NOT NULL DEFAULT 'expense', -- expense, income
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_categories_family_id ON categories(family_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
```

**Constraints:**
- Subcategories must have same classification as parent
- Maximum 2 levels (no nested subcategories)

---

### tags

**Purpose**: Flexible transaction tagging

```sql
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id),
    name VARCHAR,
    color VARCHAR NOT NULL DEFAULT '#e99537',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_tags_family_id ON tags(family_id);
```

---

### taggings

**Purpose**: Polymorphic many-to-many relationship for tags

```sql
CREATE TABLE taggings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID NOT NULL REFERENCES tags(id),
    taggable_type VARCHAR NOT NULL, -- Currently: Transaction
    taggable_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_taggings_tag_id ON taggings(tag_id);
CREATE INDEX idx_taggings_taggable ON taggings(taggable_type, taggable_id);
```

---

### merchants

**Purpose**: Merchant/vendor tracking (Single Table Inheritance)

```sql
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID,
    type VARCHAR NOT NULL, -- FamilyMerchant, ProviderMerchant
    name VARCHAR NOT NULL,
    color VARCHAR,
    logo_url VARCHAR,
    website_url VARCHAR,
    source VARCHAR,
    provider_merchant_id VARCHAR,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_merchants_family_id ON merchants(family_id);
CREATE INDEX idx_merchants_type ON merchants(type);
CREATE UNIQUE INDEX idx_merchants_family_name ON merchants(family_id, name) WHERE type = 'FamilyMerchant';
CREATE UNIQUE INDEX idx_merchants_provider ON merchants(source, name) WHERE type = 'ProviderMerchant';
```

**Types:**
- `FamilyMerchant`: User-created merchant
- `ProviderMerchant`: Merchant from data provider (Plaid)

---

## Budgeting

### budgets

**Purpose**: Budget periods for families

```sql
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budgeted_spending NUMERIC(19,4),
    expected_income NUMERIC(19,4),
    currency VARCHAR NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(family_id, start_date, end_date)
);
```

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_budgets_family_dates ON budgets(family_id, start_date, end_date);
CREATE INDEX idx_budgets_family_id ON budgets(family_id);
```

---

### budget_categories

**Purpose**: Per-category budget allocations

```sql
CREATE TABLE budget_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budgets(id),
    category_id UUID NOT NULL REFERENCES categories(id),
    budgeted_spending NUMERIC(19,4) NOT NULL,
    currency VARCHAR NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(budget_id, category_id)
);
```

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_budget_categories_budget_category ON budget_categories(budget_id, category_id);
CREATE INDEX idx_budget_categories_budget_id ON budget_categories(budget_id);
CREATE INDEX idx_budget_categories_category_id ON budget_categories(category_id);
```

---

## Transfers

### transfers

**Purpose**: Track linked transactions representing transfers between accounts

```sql
CREATE TABLE transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inflow_transaction_id UUID NOT NULL UNIQUE,
    outflow_transaction_id UUID NOT NULL UNIQUE,
    status VARCHAR NOT NULL DEFAULT 'pending', -- pending, confirmed
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(inflow_transaction_id, outflow_transaction_id)
);
```

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_transfers_transactions ON transfers(inflow_transaction_id, outflow_transaction_id);
CREATE INDEX idx_transfers_inflow ON transfers(inflow_transaction_id);
CREATE INDEX idx_transfers_outflow ON transfers(outflow_transaction_id);
CREATE INDEX idx_transfers_status ON transfers(status);
```

**Foreign Keys with CASCADE:**
```sql
ALTER TABLE transfers ADD CONSTRAINT fk_transfers_inflow
    FOREIGN KEY (inflow_transaction_id) REFERENCES transactions(id) ON DELETE CASCADE;
ALTER TABLE transfers ADD CONSTRAINT fk_transfers_outflow
    FOREIGN KEY (outflow_transaction_id) REFERENCES transactions(id) ON DELETE CASCADE;
```

---

## Automation - Rules

### rules

**Purpose**: Automated transaction processing rules

```sql
CREATE TABLE rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id),
    resource_type VARCHAR NOT NULL, -- Currently: 'transaction'
    name VARCHAR,
    effective_date DATE,
    active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_rules_family_id ON rules(family_id);
```

---

### rule_conditions

**Purpose**: Rule condition logic (supports compound conditions)

```sql
CREATE TABLE rule_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES rules(id),
    parent_id UUID REFERENCES rule_conditions(id),
    condition_type VARCHAR NOT NULL,
    operator VARCHAR NOT NULL,
    value VARCHAR,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_rule_conditions_rule_id ON rule_conditions(rule_id);
CREATE INDEX idx_rule_conditions_parent_id ON rule_conditions(parent_id);
```

---

### rule_actions

**Purpose**: Actions to execute when rule matches

```sql
CREATE TABLE rule_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES rules(id),
    action_type VARCHAR NOT NULL,
    value VARCHAR,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_rule_actions_rule_id ON rule_actions(rule_id);
```

---

## Plaid Integration

### plaid_items

**Purpose**: Plaid connection to financial institutions

```sql
CREATE TABLE plaid_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id),
    access_token VARCHAR, -- NOTE: Should be encrypted at application level
    plaid_id VARCHAR NOT NULL UNIQUE,
    name VARCHAR,
    institution_id VARCHAR,
    institution_url VARCHAR,
    institution_color VARCHAR,
    plaid_region VARCHAR NOT NULL DEFAULT 'us', -- us, eu
    next_cursor VARCHAR,
    available_products TEXT[] DEFAULT '{}',
    billed_products TEXT[] DEFAULT '{}',
    status VARCHAR NOT NULL DEFAULT 'good', -- good, requires_update
    scheduled_for_deletion BOOLEAN DEFAULT false,
    raw_payload JSONB DEFAULT '{}',
    raw_institution_payload JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_plaid_items_plaid_id ON plaid_items(plaid_id);
CREATE INDEX idx_plaid_items_family_id ON plaid_items(family_id);
```

**Note**: `access_token` should be encrypted at application level (Supabase doesn't have Rails Active Record Encryption)

---

### plaid_accounts

**Purpose**: Individual accounts within a Plaid connection

```sql
CREATE TABLE plaid_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plaid_item_id UUID NOT NULL REFERENCES plaid_items(id),
    plaid_id VARCHAR NOT NULL UNIQUE,
    plaid_type VARCHAR NOT NULL,
    plaid_subtype VARCHAR,
    name VARCHAR NOT NULL,
    mask VARCHAR,
    current_balance NUMERIC(19,4),
    available_balance NUMERIC(19,4),
    currency VARCHAR NOT NULL,
    raw_payload JSONB DEFAULT '{}',
    raw_transactions_payload JSONB DEFAULT '{}',
    raw_investments_payload JSONB DEFAULT '{}',
    raw_liabilities_payload JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_plaid_accounts_plaid_id ON plaid_accounts(plaid_id);
CREATE INDEX idx_plaid_accounts_plaid_item_id ON plaid_accounts(plaid_item_id);
```

---

## Import & Export

### imports

**Purpose**: CSV import management (Single Table Inheritance)

```sql
CREATE TABLE imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id),
    account_id UUID,
    type VARCHAR NOT NULL, -- TransactionImport, TradeImport, AccountImport, MintImport
    status VARCHAR, -- pending, complete, importing, reverting, revert_failed, failed
    raw_file_str TEXT,
    normalized_csv_str TEXT,
    col_sep VARCHAR DEFAULT ',',
    date_format VARCHAR DEFAULT '%m/%d/%Y',
    number_format VARCHAR,
    signage_convention VARCHAR DEFAULT 'inflows_positive',
    amount_type_strategy VARCHAR DEFAULT 'signed_amount',
    amount_type_inflow_value VARCHAR,
    date_col_label VARCHAR,
    amount_col_label VARCHAR,
    name_col_label VARCHAR,
    category_col_label VARCHAR,
    tags_col_label VARCHAR,
    account_col_label VARCHAR,
    qty_col_label VARCHAR,
    ticker_col_label VARCHAR,
    price_col_label VARCHAR,
    entity_type_col_label VARCHAR,
    notes_col_label VARCHAR,
    currency_col_label VARCHAR,
    exchange_operating_mic_col_label VARCHAR,
    column_mappings JSONB,
    error TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_imports_family_id ON imports(family_id);
```

---

## Sync Management

### syncs

**Purpose**: Track background synchronization jobs

```sql
CREATE TABLE syncs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    syncable_type VARCHAR NOT NULL,
    syncable_id UUID NOT NULL,
    parent_id UUID REFERENCES syncs(id),
    status VARCHAR DEFAULT 'pending', -- pending, syncing, completed, failed
    error TEXT,
    data JSONB,
    window_start_date DATE,
    window_end_date DATE,
    pending_at TIMESTAMP,
    syncing_at TIMESTAMP,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_syncs_status ON syncs(status);
CREATE INDEX idx_syncs_parent_id ON syncs(parent_id);
CREATE INDEX idx_syncs_syncable ON syncs(syncable_type, syncable_id);
```

---

## Exchange Rates

### exchange_rates

**Purpose**: Historical currency exchange rates

```sql
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency VARCHAR NOT NULL,
    to_currency VARCHAR NOT NULL,
    rate NUMERIC NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_currency, to_currency, date)
);
```

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_exchange_rates_currencies_date ON exchange_rates(from_currency, to_currency, date);
CREATE INDEX idx_exchange_rates_from ON exchange_rates(from_currency);
CREATE INDEX idx_exchange_rates_to ON exchange_rates(to_currency);
```

---

## API & Authentication

### api_keys

**Purpose**: User API key authentication

```sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR,
    display_key VARCHAR NOT NULL UNIQUE,
    scopes JSON,
    source VARCHAR DEFAULT 'web', -- web, mobile
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_api_keys_display_key ON api_keys(display_key);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_revoked_at ON api_keys(revoked_at);
```

---

## AI Features

### chats

**Purpose**: AI chat conversations

```sql
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR NOT NULL,
    instructions VARCHAR,
    error JSONB,
    latest_assistant_response_id VARCHAR,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_chats_user_id ON chats(user_id);
```

---

### messages

**Purpose**: Individual messages in AI chats

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id),
    type VARCHAR NOT NULL, -- UserMessage, AssistantMessage, DeveloperMessage
    status VARCHAR NOT NULL DEFAULT 'complete', -- complete, pending, error
    content TEXT,
    ai_model VARCHAR,
    provider_id VARCHAR,
    debug BOOLEAN DEFAULT false,
    reasoning BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
```

---

## Access & Invitations

### invitations

**Purpose**: Family member invitations

```sql
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id),
    inviter_id UUID NOT NULL REFERENCES users(id),
    email VARCHAR,
    role VARCHAR,
    token VARCHAR UNIQUE,
    accepted_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email, family_id)
);
```

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_invitations_token ON invitations(token);
CREATE UNIQUE INDEX idx_invitations_email_family ON invitations(email, family_id);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_family_id ON invitations(family_id);
```

---

## File Storage

**Note**: Instead of implementing Active Storage tables, use **Supabase Storage** for file management.

For reference, if you need to replicate Active Storage:

### active_storage_blobs

```sql
CREATE TABLE active_storage_blobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR NOT NULL UNIQUE,
    filename VARCHAR NOT NULL,
    content_type VARCHAR,
    metadata TEXT,
    service_name VARCHAR NOT NULL,
    byte_size BIGINT NOT NULL,
    checksum VARCHAR,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### active_storage_attachments

```sql
CREATE TABLE active_storage_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    record_type VARCHAR NOT NULL,
    record_id UUID NOT NULL,
    blob_id UUID NOT NULL REFERENCES active_storage_blobs(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(record_type, record_id, name, blob_id)
);
```

---

## Migration Guide

### Step 1: Database Setup

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";

-- Create custom enums
CREATE TYPE account_status AS ENUM ('ok', 'syncing', 'error');
```

### Step 2: Create Tables in Order

**Critical Order** (respecting foreign key dependencies):

1. `families`
2. `users`
3. `sessions`
4. `categories`
5. `tags`
6. `merchants`
7. `securities`
8. All accountable types (`depositories`, `investments`, `cryptos`, `properties`, `vehicles`, `other_assets`, `credit_cards`, `loans`, `other_liabilities`)
9. `accounts`
10. All entryable types (`transactions`, `valuations`, `trades`)
11. `entries`
12. `taggings`
13. `balances`
14. `holdings`
15. `security_prices`
16. `exchange_rates`
17. `budgets`
18. `budget_categories`
19. `transfers`
20. `rules`, `rule_conditions`, `rule_actions`
21. `plaid_items`, `plaid_accounts`
22. `imports`
23. `syncs`
24. `api_keys`
25. `chats`, `messages`
26. `invitations`

### Step 3: Row Level Security (RLS)

**CRITICAL**: Enable RLS on all tables and create policies for multi-tenant security.

Example policies:

```sql
-- Enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Users can only see accounts in their family
CREATE POLICY "family_isolation_policy" ON accounts
    FOR ALL
    USING (family_id = current_setting('app.current_family_id')::uuid);

-- Apply similar policies to all family-scoped tables
```

### Step 4: Supabase-Specific Features

**Use Supabase Auth** instead of custom sessions:
- Replace session management with Supabase Auth
- Use `auth.users()` table
- Map Supabase user IDs to your `users` table

**Use Supabase Storage** instead of Active Storage:
- Store files in Supabase buckets
- Store file references in your tables
- Use Supabase Storage policies for access control

**Use Supabase Realtime** for live updates:
- Enable Realtime on critical tables (balances, entries, accounts)
- Stream changes to frontend

### Step 5: Encryption

**Handle access_token encryption**:
- Supabase doesn't have Rails Active Record Encryption
- Options:
  1. Use PostgreSQL `pgcrypto` extension with custom encryption functions
  2. Encrypt at application level before storing
  3. Use Supabase Vault (when available)

Example with pgcrypto:
```sql
-- Encrypt
UPDATE plaid_items
SET access_token = encode(encrypt(access_token::bytea, 'encryption_key', 'aes'), 'base64');

-- Decrypt (in queries)
SELECT convert_from(decrypt(decode(access_token, 'base64'), 'encryption_key', 'aes'), 'UTF8') as access_token
FROM plaid_items;
```

### Step 6: Triggers for updated_at

```sql
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON families
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Repeat for all tables...
```

### Step 7: Data Migration

If migrating from existing Rails app:

1. Export data from Rails DB
2. Transform data as needed
3. Import in dependency order
4. Verify foreign key relationships
5. Verify constraints
6. Test RLS policies

---

## Key Differences from Rails

| Feature | Rails | Supabase |
|---------|-------|----------|
| Primary Keys | UUID via Rails | UUID via pgcrypto |
| Timestamps | Rails callbacks | DB triggers |
| Encryption | Active Record Encryption | pgcrypto or app-level |
| File Storage | Active Storage | Supabase Storage |
| Authentication | Devise/custom | Supabase Auth |
| Multi-tenancy | App-level | RLS policies |
| Realtime | Action Cable | Supabase Realtime |

---

## Performance Optimization

### Critical Indexes

Already included in table definitions, but key ones to ensure:

1. **Composite indexes for common queries**:
   - `(account_id, date DESC)` on entries and balances
   - `(family_id, accountable_type)` on accounts
   - `(security_id, date)` on holdings and prices

2. **JSONB indexes**:
```sql
CREATE INDEX idx_accounts_locked_attrs ON accounts USING GIN (locked_attributes);
CREATE INDEX idx_plaid_items_raw_payload ON plaid_items USING GIN (raw_payload);
```

3. **Partial indexes**:
```sql
CREATE INDEX idx_users_active ON users(family_id) WHERE active = true;
CREATE INDEX idx_accounts_active ON accounts(family_id) WHERE status = 'active';
```

### Query Optimization Tips

1. Use `EXPLAIN ANALYZE` for slow queries
2. Leverage virtual columns instead of calculating in queries
3. Cache expensive calculations (net worth, balance trends)
4. Use materialized views for complex aggregations
5. Partition large tables by date if needed

---

## Summary

This schema provides:

- **Complete multi-tenant financial management system**
- **Polymorphic flexibility** for accounts and entries
- **Comprehensive balance tracking** with virtual columns
- **Investment support** with holdings and trades
- **Automation** via rules engine
- **Third-party integration** via Plaid
- **AI features** for chat-based assistance
- **Import/export** for data portability
- **API access** with key management

**Total Tables**: 48+ tables covering all aspects of personal finance management

**Next Steps**:
1. Run SQL scripts in order
2. Set up RLS policies
3. Configure Supabase Auth
4. Set up Supabase Storage
5. Enable Realtime on key tables
6. Implement application logic
7. Test thoroughly with real data
