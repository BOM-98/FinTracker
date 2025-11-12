# User Stories - Personal Finance Management App

## Feature 1: Account Creation & Onboarding

### User Story 1.1: Sign Up with Email and Password

**As a** new user
**I want to** create an account with my email and password
**So that** I can securely access the personal finance management system

**Acceptance Criteria:**

- [ ] User can navigate to a registration page
- [ ] User can enter their email address
- [ ] System validates email format (valid email pattern)
- [ ] User can enter a password
- [ ] Password must meet minimum security requirements (min 8 characters)
- [ ] User can re-enter password for confirmation
- [ ] System validates that password and confirmation match
- [ ] System checks if email is already registered
- [ ] If email exists, display error message "Email already in use"
- [ ] On successful registration, create user account in database
- [ ] System creates a new family/household record associated with the user
- [ ] User is automatically logged in after successful registration
- [ ] User is redirected to onboarding flow after account creation

**Maybe App Reference:**

- Database: `users` table (email, password_digest), `families` table
- Routes: `resource :registration, only: %i[new create]` (routes.rb:38)
- Controller: `app/controllers/registrations_controller.rb`
- Models: `app/models/user.rb`, `app/models/family.rb`

---

### User Story 1.2: Set Up Personal Profile Information

**As a** new user
**I want to** provide my first name, last name, and household name
**So that** the app can personalize my experience

**Acceptance Criteria:**

- [ ] During onboarding, user is prompted to enter first name
- [ ] During onboarding, user is prompted to enter last name
- [ ] During onboarding, user is prompted to enter household name
- [ ] First name field is required (min 2 characters)
- [ ] Last name field is required (min 2 characters)
- [ ] Household name field is required (min 2 characters)
- [ ] System validates that fields are not empty
- [ ] User can edit these fields later in settings
- [ ] On save, data is persisted to database
- [ ] User is shown next step in onboarding flow

**Maybe App Reference:**

- Database: `users` table (first_name, last_name), `families` table (name)
- Routes: `resource :onboarding, only: :show` with `preferences` collection route (routes.rb:49-55)
- Controller: `app/controllers/onboarding_controller.rb`
- Views: `app/views/onboarding/preferences.html.erb`

---

### User Story 1.3: Select Country

**As a** new user
**I want to** select my country
**So that** the app can provide region-specific features and defaults

**Acceptance Criteria:**

- [ ] During onboarding, user is presented with a country selector
- [ ] Country selector displays a searchable list of countries
- [ ] User can search/filter countries by name
- [ ] User can select one country from the list
- [ ] Selected country is highlighted/indicated
- [ ] Default country is set based on user's IP location (optional enhancement)
- [ ] Country selection is required to proceed
- [ ] Selected country is saved to family/household settings
- [ ] Country setting affects default currency, date format, and timezone

**Maybe App Reference:**

- Database: `families` table (country field, default: "US")
- Routes: `resource :onboarding` preferences route (routes.rb:51)
- Controller: `app/controllers/onboarding_controller.rb`

---

### User Story 1.4: Select Currency

**As a** new user
**I want to** select my preferred currency
**So that** all financial data is displayed in my local currency

**Acceptance Criteria:**

- [ ] During onboarding, user is presented with a currency selector
- [ ] Currency selector displays a searchable list of currencies (USD, EUR, GBP, etc.)
- [ ] Each currency shows its symbol and code (e.g., "USD - $")
- [ ] User can search/filter currencies by name or code
- [ ] User can select one primary currency
- [ ] Default currency is pre-selected based on selected country
- [ ] Currency selection is required to proceed
- [ ] Selected currency is saved to family settings
- [ ] This becomes the default currency for all accounts and transactions
- [ ] User can change currency later in settings (with data conversion implications)

**Maybe App Reference:**

- Database: `families` table (currency field, default: "USD")
- Database: `exchange_rates` table for multi-currency support
- Routes: `resource :onboarding` preferences route (routes.rb:51)
- Resources: `app/models/family.rb`, `app/models/exchange_rate.rb`

---

### User Story 1.5: Select Date Format

**As a** new user
**I want to** choose my preferred date format
**So that** dates are displayed in a familiar format throughout the app

**Acceptance Criteria:**

- [ ] During onboarding, user is presented with date format options
- [ ] Date format options include common formats:
  - [ ] MM-DD-YYYY (e.g., 12-31-2024)
  - [ ] DD-MM-YYYY (e.g., 31-12-2024)
  - [ ] YYYY-MM-DD (e.g., 2024-12-31)
  - [ ] Other regional formats
- [ ] Each format option shows an example with current date
- [ ] User can select one date format
- [ ] Default date format is pre-selected based on country
- [ ] Date format selection is required to proceed
- [ ] Selected format is saved to family settings
- [ ] All dates throughout the app respect this format
- [ ] User can change date format later in settings

**Maybe App Reference:**

- Database: `families` table (date_format field, default: "%m-%d-%Y")
- Routes: `namespace :settings` > `resource :preferences` (routes.rb:59)
- Controller: `app/controllers/settings/preferences_controller.rb`

---

### User Story 1.6: Select System Theme

**As a** new user
**I want to** choose my preferred theme (light, dark, or system)
**So that** the app's appearance matches my preferences and environment

**Acceptance Criteria:**

- [ ] During onboarding, user is presented with theme options
- [ ] Theme options include:
  - [ ] Light mode
  - [ ] Dark mode
  - [ ] System (automatically matches OS theme)
- [ ] Each theme option shows a visual preview
- [ ] User can select one theme
- [ ] Default theme is "System"
- [ ] Theme selection is optional (can skip with default)
- [ ] Selected theme is saved to user settings
- [ ] Theme is immediately applied to the interface
- [ ] User can change theme later in settings
- [ ] Theme preference persists across sessions

**Maybe App Reference:**

- Database: `users` table (theme field, default: "system")
- Routes: `namespace :settings` > `resource :preferences` (routes.rb:59)
- Controller: `app/controllers/settings/preferences_controller.rb`
- Models: `app/models/user.rb`

---

### User Story 1.7: Complete Onboarding

**As a** new user
**I want to** finish the onboarding process
**So that** I can start using the app with my personalized settings

**Acceptance Criteria:**

- [ ] After completing all onboarding steps, user sees a completion screen
- [ ] Completion screen confirms settings have been saved
- [ ] User sees a "Get Started" or "Go to Dashboard" button
- [ ] Clicking the button redirects user to main dashboard
- [ ] System marks user as onboarded (onboarded_at timestamp set)
- [ ] User should not see onboarding flow again on subsequent logins
- [ ] If user refreshes during onboarding, they can resume where they left off
- [ ] User can skip optional steps but required steps must be completed

**Maybe App Reference:**

- Database: `users` table (onboarded_at field)
- Routes: `resource :onboarding` with preferences, goals, trial collection routes (routes.rb:49-55)
- Controller: `app/controllers/onboarding_controller.rb`
- Redirect logic to dashboard after completion

---

### User Story 1.8: Edit Profile Settings After Onboarding

**As a** registered user
**I want to** edit my profile and preferences
**So that** I can update my information as needed

**Acceptance Criteria:**

- [ ] User can navigate to settings/profile page
- [ ] User can view current first name, last name, email
- [ ] User can edit first name and last name
- [ ] User can view current household name
- [ ] User can edit household name
- [ ] User can view current country, currency, date format, theme
- [ ] User can edit country, currency, date format, theme
- [ ] Changes are validated before saving
- [ ] User sees success message on successful save
- [ ] User sees error messages if validation fails
- [ ] Changes are immediately reflected throughout the app
- [ ] Changing currency may trigger a warning about existing data

**Maybe App Reference:**

- Routes: `namespace :settings` with profile and preferences resources (routes.rb:57-66)
- Controllers: `app/controllers/settings/profile_controller.rb`, `app/controllers/settings/preferences_controller.rb`
- Views: `app/views/settings/profile/`, `app/views/settings/preferences/`

---

## Feature 2: Connect Bank Accounts Using Plaid

### User Story 2.1: Initiate Plaid Bank Connection

**As a** user
**I want to** connect my bank account through Plaid
**So that** my transactions and balances are automatically synced

**Acceptance Criteria:**

- [ ] User can navigate to "Connect Account" or "Add Account" page
- [ ] User is presented with option to connect via Plaid
- [ ] User can select their region (US or EU)
- [ ] System generates a Plaid Link token from the server
- [ ] Plaid Link modal opens automatically
- [ ] User sees list of supported financial institutions
- [ ] User can search for their bank by name
- [ ] User can select their financial institution from the list
- [ ] Plaid Link UI is responsive and accessible

**Maybe App Reference:**

- Database: `plaid_items` table, `plaid_accounts` table
- Routes: `resources :plaid_items, only: %i[new edit create destroy]` (routes.rb:248-252)
- Controller: `app/controllers/plaid_items_controller.rb` (new action generates link_token)
- Model: `app/models/family/plaid_connectable.rb` (get_link_token method)
- JavaScript: `app/javascript/controllers/plaid_controller.js` (Plaid.create())
- View: `app/views/plaid_items/new.html.erb`
- Provider: `app/models/provider/plaid.rb`

**Tasks:**

- [ ] Create Plaid account connection page/modal
- [ ] Integrate Plaid Link SDK (frontend library)
- [ ] Create server endpoint to generate link_token
- [ ] Implement region selection (US/EU)
- [ ] Configure Plaid webhook URLs
- [ ] Handle Plaid Link modal opening and lifecycle
- [ ] Add loading states during link token generation

---

### User Story 2.2: Authenticate with Bank Through Plaid

**As a** user
**I want to** securely authenticate with my bank through Plaid
**So that** I can authorize access to my financial data

**Acceptance Criteria:**

- [ ] User enters their online banking credentials in Plaid Link modal
- [ ] Plaid Link displays the bank's native login interface
- [ ] User can enter username/password securely
- [ ] If bank requires MFA, user can complete MFA flow (SMS, authenticator app, etc.)
- [ ] If bank requires security questions, user can answer them
- [ ] User credentials are never exposed to the application
- [ ] User credentials are handled securely by Plaid
- [ ] System displays appropriate error messages if authentication fails
- [ ] User can retry authentication if it fails
- [ ] User can cancel the flow at any time

**Maybe App Reference:**

- JavaScript: `app/javascript/controllers/plaid_controller.js` (handleSuccess, handleExit callbacks)
- All authentication handled within Plaid Link modal (third-party)

**Tasks:**

- [ ] Configure Plaid Link error handling
- [ ] Implement onExit callback for handling cancellation
- [ ] Display appropriate error messages from Plaid
- [ ] Handle MFA flows (delegated to Plaid)
- [ ] Add user feedback during authentication process

---

### User Story 2.3: Select Accounts to Connect

**As a** user
**I want to** select which accounts from my bank to connect
**So that** I only sync the accounts I want to track

**Acceptance Criteria:**

- [ ] After successful authentication, user sees list of available accounts
- [ ] Each account shows account name, type, and last 4 digits (mask)
- [ ] User can select/deselect accounts to connect
- [ ] User can select all accounts or individual accounts
- [ ] At least one account must be selected to continue
- [ ] User sees account types (checking, savings, credit card, etc.)
- [ ] User can continue to next step after selecting accounts
- [ ] Selected accounts are passed to the application

**Maybe App Reference:**

- JavaScript: `app/javascript/controllers/plaid_controller.js` (handleSuccess receives metadata)
- Metadata includes selected accounts information
- Plaid Link handles account selection UI

**Tasks:**

- [ ] Configure Plaid Link to show account selection
- [ ] Receive and parse selected accounts metadata
- [ ] Store account selection preferences
- [ ] Validate at least one account is selected

---

### User Story 2.4: Exchange Public Token and Create Connection

**As a** user
**I want to** the app to securely establish a connection with my bank
**So that** my data can be synced automatically

**Acceptance Criteria:**

- [ ] After successful Plaid Link flow, public_token is received
- [ ] System sends public_token to server
- [ ] Server exchanges public_token for access_token via Plaid API
- [ ] System creates PlaidItem record with access_token (encrypted)
- [ ] System stores institution name and metadata
- [ ] System stores Plaid item ID
- [ ] Access token is encrypted in the database
- [ ] System displays success message to user
- [ ] User is redirected to accounts page
- [ ] Connection appears in user's connected institutions list

**Maybe App Reference:**

- Database: `plaid_items` table (access_token encrypted, name, plaid_id, family_id)
- Routes: `POST /plaid_items` (routes.rb:248)
- Controller: `app/controllers/plaid_items_controller.rb` (create action)
- Model: `app/models/family/plaid_connectable.rb` (create_plaid_item! method)
- JavaScript: `app/javascript/controllers/plaid_controller.js` (handleSuccess sends POST request)
- Encryption: Uses Rails encrypted attributes for access_token

**Tasks:**

- [ ] Create server endpoint to exchange public_token
- [ ] Implement Plaid API call to exchange tokens
- [ ] Create database record for PlaidItem
- [ ] Encrypt access_token before storing
- [ ] Store institution metadata (name, logo, color)
- [ ] Handle token exchange errors
- [ ] Return success/error response to frontend
- [ ] Redirect user after successful connection

---

### User Story 2.5: Initial Account Sync

**As a** user
**I want to** my accounts to sync immediately after connection
**So that** I can see my financial data right away

**Acceptance Criteria:**

- [ ] After PlaidItem is created, sync is triggered automatically
- [ ] System fetches account data from Plaid API
- [ ] System creates Account records for each Plaid account
- [ ] System fetches recent transactions (default last 30-90 days)
- [ ] System fetches current balances
- [ ] System creates Transaction records from Plaid transactions
- [ ] System creates Balance records for historical data
- [ ] Sync runs as a background job
- [ ] User sees loading indicator during initial sync
- [ ] User is notified when sync is complete
- [ ] Newly synced accounts appear in accounts list
- [ ] Transactions appear in transactions list

**Maybe App Reference:**

- Database: `plaid_accounts` table, `accounts` table, `entries` table (transactions), `balances` table, `syncs` table
- Model: `app/models/plaid_item.rb` (sync_later, import_latest_plaid_data)
- Model: `app/models/plaid_item/importer.rb` - handles importing data from Plaid
- Model: `app/models/plaid_item/syncer.rb` - manages sync process
- Model: `app/models/plaid_account/processor.rb` - processes individual accounts
- Model: `app/models/plaid_account/transactions/processor.rb` - processes transactions
- Jobs: Background sync jobs via Sidekiq
- Sync model: `app/models/concerns/syncable.rb`

**Tasks:**

- [ ] Create background job for initial sync
- [ ] Implement Plaid API calls to fetch accounts
- [ ] Implement Plaid API calls to fetch transactions
- [ ] Implement Plaid API calls to fetch balances
- [ ] Map Plaid account types to application account types
- [ ] Create Account records from Plaid data
- [ ] Create Transaction records from Plaid transactions
- [ ] Create Balance records for historical balances
- [ ] Handle sync errors and retry logic
- [ ] Update UI when sync completes
- [ ] Store sync status (pending, syncing, completed, failed)

---

### User Story 2.6: View Connected Institutions

**As a** user
**I want to** see all my connected financial institutions
**So that** I can manage my connections

**Acceptance Criteria:**

- [ ] User can navigate to accounts page
- [ ] User sees list of connected institutions
- [ ] Each institution shows:
  - [ ] Institution name
  - [ ] Institution logo
  - [ ] Number of connected accounts
  - [ ] Last sync time
  - [ ] Connection status (good, requires_update, error)
- [ ] User can click on institution to see details
- [ ] User can manually trigger a sync
- [ ] User can disconnect/remove institution
- [ ] Institutions are sorted by most recently added

**Maybe App Reference:**

- Database: `plaid_items` table (name, institution_url, institution_color, status, updated_at)
- Routes: `resources :plaid_items` (routes.rb:248-252)
- Controller: `app/controllers/accounts_controller.rb` (index shows all accounts grouped by institution)
- Model: `app/models/plaid_item.rb` (status enum: good, requires_update)
- Views: `app/views/accounts/index.html.erb`, `app/views/plaid_items/_plaid_item.html.erb`

**Tasks:**

- [ ] Create UI to list connected institutions
- [ ] Display institution logos and metadata
- [ ] Show connection status with visual indicators
- [ ] Implement manual sync button
- [ ] Show last sync timestamp
- [ ] Group accounts by institution
- [ ] Add remove/disconnect functionality

---

### User Story 2.7: Reconnect/Update Bank Connection

**As a** user
**I want to** update my bank credentials when they change
**So that** my accounts stay connected and synced

**Acceptance Criteria:**

- [ ] When bank credentials change, connection status shows "requires_update"
- [ ] User sees a clear indicator that connection needs attention
- [ ] User can click "Reconnect" or "Update Connection" button
- [ ] Plaid Link modal opens in update mode
- [ ] User re-authenticates with updated credentials
- [ ] System receives updated access token from Plaid
- [ ] System triggers a sync to verify connection
- [ ] Connection status updates to "good" after successful reconnection
- [ ] User sees success message after reconnection
- [ ] Existing accounts and historical data are preserved
- [ ] No duplicate accounts are created

**Maybe App Reference:**

- Database: `plaid_items` table (status field: "good" or "requires_update")
- Routes: `GET /plaid_items/:id/edit` (routes.rb:248)
- Controller: `app/controllers/plaid_items_controller.rb` (edit action)
- Model: `app/models/plaid_item.rb` (get_update_link_token method)
- JavaScript: `app/javascript/controllers/plaid_controller.js` (isUpdate mode)
- Views: `app/views/plaid_items/edit.html.erb`

**Tasks:**

- [ ] Detect when connection requires update (via webhooks)
- [ ] Display "requires update" status to user
- [ ] Create update/reconnect flow
- [ ] Generate update link token from Plaid
- [ ] Open Plaid Link in update mode
- [ ] Handle successful reconnection
- [ ] Trigger sync after reconnection
- [ ] Update connection status in database
- [ ] Preserve existing accounts and data

---

### User Story 2.8: Handle Plaid Webhooks

**As a** system
**I want to** receive and process webhooks from Plaid
**So that** connections stay up-to-date and errors are handled automatically

**Acceptance Criteria:**

- [ ] System has webhook endpoint configured for Plaid
- [ ] Webhook endpoint is secured (validates Plaid signature)
- [ ] System handles different webhook types:
  - [ ] INITIAL_UPDATE - first data fetch complete
  - [ ] HISTORICAL_UPDATE - historical data fetch complete
  - [ ] DEFAULT_UPDATE - new transaction data available
  - [ ] TRANSACTIONS_REMOVED - transactions were removed
  - [ ] ERROR - connection error occurred
  - [ ] PENDING_EXPIRATION - credentials will expire soon
  - [ ] USER_PERMISSION_REVOKED - user revoked access
- [ ] System triggers appropriate actions based on webhook type
- [ ] System logs all webhook events
- [ ] System updates PlaidItem status based on webhooks
- [ ] System handles webhook processing asynchronously
- [ ] Failed webhook processing is retried

**Maybe App Reference:**

- Routes: `post "webhooks/plaid"` and `post "webhooks/plaid_eu"` (routes.rb:254-257)
- Controller: `app/controllers/webhooks_controller.rb`
- Model: `app/models/plaid_item/webhook_processor.rb` - processes different webhook types
- Database: `syncs` table tracks sync events triggered by webhooks

**Tasks:**

- [ ] Create webhook endpoint in Next.js API routes
- [ ] Implement webhook signature verification
- [ ] Parse webhook payload
- [ ] Route webhooks to appropriate handlers
- [ ] Implement handler for each webhook type
- [ ] Update connection status based on webhooks
- [ ] Trigger syncs when new data is available
- [ ] Handle error webhooks
- [ ] Log all webhook events
- [ ] Implement retry logic for failed processing
- [ ] Set up webhook monitoring/alerting

---

### User Story 2.9: Manual Account Sync

**As a** user
**I want to** manually trigger a sync of my connected accounts
**So that** I can get the latest data on demand

**Acceptance Criteria:**

- [ ] User can see a "Sync" or "Refresh" button for each connected institution
- [ ] User can click the button to trigger a sync
- [ ] System checks if sync is already in progress
- [ ] If sync is in progress, user sees "Syncing..." status
- [ ] If no sync in progress, new sync is initiated
- [ ] User sees loading indicator during sync
- [ ] System fetches latest data from Plaid API
- [ ] System updates accounts, transactions, and balances
- [ ] User sees success message when sync completes
- [ ] User sees error message if sync fails
- [ ] Last sync timestamp is updated
- [ ] User can sync all institutions at once or individually

**Maybe App Reference:**

- Routes: `POST /plaid_items/:id/sync` (routes.rb:250) and `POST /accounts/sync_all` (routes.rb:167)
- Controller: `app/controllers/plaid_items_controller.rb` (sync action)
- Model: `app/models/plaid_item.rb` (sync_later method)
- Model: `app/models/concerns/syncable.rb` - sync state machine
- Database: `syncs` table (status: pending, syncing, completed, failed)

**Tasks:**

- [ ] Create sync button in UI
- [ ] Implement sync endpoint
- [ ] Check for existing sync in progress
- [ ] Create sync record with status
- [ ] Trigger background sync job
- [ ] Update UI with sync status
- [ ] Handle sync completion/failure
- [ ] Update last sync timestamp
- [ ] Add "Sync All" functionality
- [ ] Rate limit sync requests

---

### User Story 2.10: Disconnect Bank Account

**As a** user
**I want to** disconnect a bank from my account
**So that** it stops syncing data I no longer want to track

**Acceptance Criteria:**

- [ ] User can see a "Disconnect" or "Remove" button for each connected institution
- [ ] User clicks disconnect button
- [ ] User sees confirmation dialog explaining consequences
- [ ] Confirmation dialog explains:
  - [ ] Connection will be removed
  - [ ] Historical data will be preserved
  - [ ] Future syncing will stop
  - [ ] User can reconnect later if needed
- [ ] User confirms disconnection
- [ ] System revokes access with Plaid (removes item)
- [ ] System marks PlaidItem as scheduled for deletion
- [ ] System stops future syncs
- [ ] Connected accounts remain in system but marked as inactive
- [ ] Historical transactions and balances are preserved
- [ ] User sees success message
- [ ] Institution is removed from connected list

**Maybe App Reference:**

- Routes: `DELETE /plaid_items/:id` (routes.rb:248)
- Controller: `app/controllers/plaid_items_controller.rb` (destroy action)
- Model: `app/models/plaid_item.rb` (destroy_later, remove_plaid_item methods)
- Database: `plaid_items` table (scheduled_for_deletion flag)
- Model callback: `before_destroy :remove_plaid_item` calls Plaid API to remove item

**Tasks:**

- [ ] Create disconnect button in UI
- [ ] Build confirmation dialog
- [ ] Implement disconnect endpoint
- [ ] Call Plaid API to remove item
- [ ] Mark PlaidItem for deletion
- [ ] Schedule background job for cleanup
- [ ] Preserve historical data
- [ ] Mark accounts as inactive
- [ ] Stop future syncs
- [ ] Handle disconnect errors (item not found, etc.)
- [ ] Update UI after disconnection

---

### User Story 2.11: Handle Investment Accounts from Plaid

**As a** user with investment accounts
**I want to** connect my investment accounts through Plaid
**So that** I can track my portfolio and holdings

**Acceptance Criteria:**

- [ ] User can connect brokerage accounts through Plaid
- [ ] System fetches investment account data
- [ ] System creates Investment account records
- [ ] System fetches holdings (stocks, ETFs, mutual funds)
- [ ] System creates Holding records for each position
- [ ] System fetches securities information (ticker, name, prices)
- [ ] System creates Security records
- [ ] System fetches investment transactions (buys, sells, dividends)
- [ ] System creates Trade records for investment transactions
- [ ] Holdings are updated during each sync
- [ ] User can see current holdings and their values
- [ ] User can see historical holdings over time

**Maybe App Reference:**

- Database: `investments` table (account type), `holdings` table, `securities` table, `trades` table
- Model: `app/models/plaid_account/investments/holdings_processor.rb`
- Model: `app/models/plaid_account/investments/transactions_processor.rb`
- Model: `app/models/plaid_account/investments/security_resolver.rb`
- Model: `app/models/plaid_account/investments/balance_calculator.rb`
- Plaid API: Uses investments/holdings and investments/transactions endpoints

**Tasks:**

- [ ] Handle investment account type mapping
- [ ] Fetch holdings from Plaid API
- [ ] Create Holding records
- [ ] Fetch and store security information
- [ ] Create Security records
- [ ] Fetch investment transactions
- [ ] Create Trade records
- [ ] Calculate investment account balances
- [ ] Update holdings on each sync
- [ ] Display holdings in UI
- [ ] Show historical holdings

---

### User Story 2.12: Handle Credit Cards and Loans from Plaid

**As a** user with credit cards or loans
**I want to** connect my credit cards and loans through Plaid
**So that** I can track my liabilities automatically

**Acceptance Criteria:**

- [ ] User can connect credit card accounts
- [ ] User can connect loan accounts (mortgages, student loans, auto loans)
- [ ] System creates CreditCard or Loan account records
- [ ] System fetches credit card specific data (APR, credit limit, min payment)
- [ ] System fetches loan specific data (interest rate, term, balance)
- [ ] System classifies accounts as liabilities
- [ ] System fetches transactions for credit cards
- [ ] Balances are displayed as negative (liabilities)
- [ ] Credit utilization is calculated for credit cards
- [ ] Loan amortization data is tracked
- [ ] All liability data syncs automatically

**Maybe App Reference:**

- Database: `credit_cards` table, `loans` table (polymorphic accountable)
- Model: `app/models/plaid_account/liabilities/credit_processor.rb`
- Model: `app/models/plaid_account/liabilities/mortgage_processor.rb`
- Model: `app/models/plaid_account/liabilities/student_loan_processor.rb`
- Database schema: `accounts` table with `classification` virtual column (liability vs asset)
- Plaid API: Uses liabilities/get endpoint

**Tasks:**

- [ ] Handle credit card account type mapping
- [ ] Handle loan account type mapping
- [ ] Fetch credit card liability data
- [ ] Fetch loan liability data
- [ ] Create CreditCard records with APR, limits
- [ ] Create Loan records with rates, terms
- [ ] Classify as liabilities in database
- [ ] Calculate credit utilization
- [ ] Track loan payoff progress
- [ ] Display liability-specific metrics

---

### User Story 2.13: Multi-Currency Support for Plaid Accounts

**As a** user with accounts in different currencies
**I want to** connect accounts with non-default currencies
**So that** all my accounts are tracked accurately

**Acceptance Criteria:**

- [ ] System detects account currency from Plaid data
- [ ] System stores account currency in database
- [ ] System stores transaction currency
- [ ] System fetches exchange rates for non-default currencies
- [ ] System converts balances to user's primary currency
- [ ] System converts transactions to user's primary currency
- [ ] Original currency amounts are preserved
- [ ] User can view amounts in original or converted currency
- [ ] Historical exchange rates are used for historical data
- [ ] Dashboard shows net worth in primary currency
- [ ] Reports can show data in multiple currencies

**Maybe App Reference:**

- Database: `accounts` table (currency field), `entries` table (currency), `balances` table (currency)
- Database: `exchange_rates` table (from_currency, to_currency, rate, date)
- Model: `app/models/exchange_rate.rb`
- Database: `plaid_accounts` table (currency field)
- Multi-currency is core feature throughout the app

**Tasks:**

- [ ] Detect and store account currency
- [ ] Fetch exchange rates from API
- [ ] Store historical exchange rates
- [ ] Convert balances using appropriate rates
- [ ] Convert transactions using transaction date rates
- [ ] Display both original and converted amounts
- [ ] Aggregate multi-currency accounts in reports
- [ ] Handle currency conversion in calculations

---

## Feature 3: Dashboard - Net Worth & Balance Sheet

### User Story 3.1: View Current Net Worth

**As a** user
**I want to** see my current net worth at a glance
**So that** I understand my overall financial position

**Acceptance Criteria:**

- [ ] Dashboard displays prominently the current net worth value
- [ ] Net worth is calculated as Total Assets - Total Liabilities
- [ ] Net worth is displayed in user's primary currency
- [ ] Amount is formatted with proper currency symbol and thousands separators
- [ ] Net worth updates when account balances change
- [ ] Net worth value is large and easily readable
- [ ] Zero or negative net worth displays appropriately

**Maybe App Reference:**

- Controller: `app/controllers/pages_controller.rb` (dashboard action, line 6)
- Model: `app/models/balance_sheet.rb` (net_worth method)
- Model: `app/models/balance_sheet/classification_group.rb` (calculates asset/liability totals)
- View: `app/views/pages/dashboard.html.erb`
- View: `app/views/pages/dashboard/_net_worth_chart.html.erb`
- Database: `accounts` table (balance field), `balances` table

**Tasks:**

- [ ] Create dashboard page component
- [ ] Fetch balance sheet data from API
- [ ] Calculate net worth (assets - liabilities)
- [ ] Format currency display
- [ ] Handle multi-currency conversion
- [ ] Display prominently in UI
- [ ] Add loading states
- [ ] Handle zero/negative values

---

### User Story 3.2: View Net Worth Trend Over Time

**As a** user
**I want to** see how my net worth has changed over time
**So that** I can track my financial progress

**Acceptance Criteria:**

- [ ] Dashboard displays a line chart showing net worth trend
- [ ] Chart shows daily data points for selected period
- [ ] Chart displays smooth trendline
- [ ] X-axis shows start and end dates
- [ ] Y-axis shows currency values
- [ ] Chart has gradient fill below the trendline
- [ ] Chart uses green for positive trend, red for negative
- [ ] Chart is responsive and resizes appropriately
- [ ] Hover shows tooltip with exact date and value
- [ ] Chart loads with default period (last 30 days)

**Maybe App Reference:**

- Model: `app/models/balance_sheet/net_worth_series_builder.rb` (builds time series)
- Model: `app/models/balance/chart_series_builder.rb` (complex SQL for historical balances)
- Model: `app/models/series.rb` (time series data structure)
- JavaScript: `app/javascript/controllers/time_series_chart_controller.js` (D3.js chart)
- View: `app/views/pages/dashboard/_net_worth_chart.html.erb`
- Database: `balances` table (daily snapshots)

**Tasks:**

- [ ] Create time series chart component (D3.js, Chart.js, or Recharts)
- [ ] Fetch historical balance data from API
- [ ] Generate daily data points for period
- [ ] Handle data aggregation (daily vs weekly intervals)
- [ ] Implement line chart with gradient
- [ ] Add hover tooltip functionality
- [ ] Implement responsive resizing
- [ ] Color code based on trend direction
- [ ] Cache chart data for performance
- [ ] Handle empty/insufficient data states

---

### User Story 3.3: Select Time Period for Net Worth Trend

**As a** user
**I want to** view my net worth trend for different time periods
**So that** I can analyze short-term and long-term financial progress

**Acceptance Criteria:**

- [ ] User sees a period selector dropdown
- [ ] Available periods include:
  - [ ] Last 7 days
  - [ ] Last 30 days (default)
  - [ ] Last 90 days
  - [ ] Last 365 days
  - [ ] Last 5 years
  - [ ] Custom date range (optional)
- [ ] Selecting a period updates the chart
- [ ] Chart interval adjusts (daily for < 1 year, weekly for 1+ years)
- [ ] Period selector persists selection in URL/state
- [ ] Loading indicator shows while chart updates
- [ ] Chart smoothly transitions between periods

**Maybe App Reference:**

- Model: `app/models/period.rb` (predefined periods)
- Controller: `app/controllers/pages_controller.rb` (period param handling)
- Concern: `app/controllers/concerns/periodable.rb`
- JavaScript: `app/javascript/controllers/auto_submit_form_controller.js` (auto-submit on change)

**Tasks:**

- [ ] Create period selector dropdown component
- [ ] Implement period options (7d, 30d, 90d, 365d, 5y)
- [ ] Handle period parameter in URL
- [ ] Update chart when period changes
- [ ] Adjust data interval based on period length
- [ ] Persist selection in URL query params
- [ ] Add loading states during data fetch
- [ ] Implement custom date range picker (optional)

---

### User Story 3.4: View Trend Comparison

**As a** user
**I want to** see how my net worth has changed compared to a previous period
**So that** I can understand if I'm improving or declining

**Acceptance Criteria:**

- [ ] Dashboard shows net worth change for selected period
- [ ] Change displays as dollar amount (e.g., "+$5,234")
- [ ] Change displays as percentage (e.g., "+12.5%")
- [ ] Positive changes shown in green with up arrow
- [ ] Negative changes shown in red with down arrow
- [ ] No change shown in gray with flat indicator
- [ ] Comparison label explains timeframe (e.g., "vs. last month")
- [ ] Trend updates when period changes

**Maybe App Reference:**

- Model: `app/models/trend.rb` (calculates change metrics)
- Model: `app/models/series.rb` (includes trend data)
- Attributes: `value`, `percent`, `direction`, `color`, `icon`

**Tasks:**

- [ ] Calculate period start vs end balance
- [ ] Calculate dollar amount change
- [ ] Calculate percentage change
- [ ] Determine trend direction (up/down/flat)
- [ ] Color code based on direction
- [ ] Display trend indicators (arrows, colors)
- [ ] Generate comparison label
- [ ] Update trend when period changes

---

### User Story 3.5: View Balance Sheet - Assets

**As a** user
**I want to** see a breakdown of all my assets
**So that** I know what I own and where my wealth is distributed

**Acceptance Criteria:**

- [ ] Dashboard displays an "Assets" section
- [ ] Assets section shows total assets value
- [ ] Assets are grouped by type:
  - [ ] Depository (checking, savings)
  - [ ] Investment (stocks, bonds)
  - [ ] Property
  - [ ] Vehicle
  - [ ] Crypto
  - [ ] Other Assets
- [ ] Each group shows:
  - [ ] Group name
  - [ ] Total value for group
  - [ ] Percentage of total assets
  - [ ] Visual weight bar (percentage indicator)
- [ ] Groups are color-coded for visual distinction
- [ ] Groups can expand/collapse to show individual accounts
- [ ] Individual accounts show name and current balance
- [ ] All values in user's primary currency

**Maybe App Reference:**

- Model: `app/models/balance_sheet.rb` (balance_sheet.assets)
- Model: `app/models/balance_sheet/classification_group.rb` (ClassificationGroup for assets)
- Model: `app/models/balance_sheet/account_group.rb` (groups by accountable_type)
- View: `app/views/pages/dashboard/_balance_sheet.html.erb`
- View: `app/views/pages/dashboard/_group_weight.html.erb`
- Database: `accounts` table (classification = "asset")

**Tasks:**

- [ ] Fetch all asset accounts
- [ ] Group accounts by accountable_type
- [ ] Calculate total assets
- [ ] Calculate group totals and percentages
- [ ] Create expandable/collapsible sections
- [ ] Display visual weight bars
- [ ] Color code account groups
- [ ] Handle multi-currency conversion
- [ ] Sort groups by value (highest first)
- [ ] Show individual account details

---

### User Story 3.6: View Balance Sheet - Liabilities

**As a** user
**I want to** see a breakdown of all my liabilities
**So that** I know what I owe and can manage my debts

**Acceptance Criteria:**

- [ ] Dashboard displays a "Liabilities" section
- [ ] Liabilities section shows total liabilities value
- [ ] Liabilities are grouped by type:
  - [ ] Credit Cards
  - [ ] Loans (mortgage, student, auto)
  - [ ] Other Liabilities
- [ ] Each group shows:
  - [ ] Group name
  - [ ] Total value for group
  - [ ] Percentage of total liabilities
  - [ ] Visual weight bar
- [ ] Groups are color-coded differently from assets
- [ ] Groups can expand/collapse to show individual accounts
- [ ] Individual accounts show name and current balance
- [ ] Balances display as positive numbers (representing what is owed)
- [ ] All values in user's primary currency

**Maybe App Reference:**

- Model: `app/models/balance_sheet.rb` (balance_sheet.liabilities)
- Model: `app/models/balance_sheet/classification_group.rb` (ClassificationGroup for liabilities)
- Model: `app/models/balance_sheet/account_group.rb`
- Database: `accounts` table (classification = "liability")

**Tasks:**

- [ ] Fetch all liability accounts
- [ ] Group accounts by accountable_type
- [ ] Calculate total liabilities
- [ ] Calculate group totals and percentages
- [ ] Create expandable/collapsible sections
- [ ] Display visual weight bars
- [ ] Color code account groups (distinct from assets)
- [ ] Handle multi-currency conversion
- [ ] Sort groups by value
- [ ] Display balances as positive amounts owed

---

### User Story 3.7: Expand/Collapse Account Groups

**As a** user
**I want to** expand and collapse account groups
**So that** I can see detailed account information when needed

**Acceptance Criteria:**

- [ ] Each account group (type) can be expanded or collapsed
- [ ] Clicking on group header toggles expand/collapse
- [ ] Visual indicator shows expand/collapse state (chevron icon)
- [ ] Expanded group shows all individual accounts in that group
- [ ] Individual accounts display:
  - [ ] Account name
  - [ ] Current balance
  - [ ] Account icon/logo (if available)
  - [ ] Percentage of group total
- [ ] Collapsed state shows only group summary
- [ ] Expand/collapse state persists during session
- [ ] Smooth animation for expand/collapse transition
- [ ] All groups collapsed by default

**Maybe App Reference:**

- View: `app/views/pages/dashboard/_balance_sheet.html.erb` (uses `<details>/<summary>`)
- HTML: Native `<details>` and `<summary>` elements for accessibility

**Tasks:**

- [ ] Create accordion/disclosure components
- [ ] Implement expand/collapse functionality
- [ ] Add visual indicators (chevron icons)
- [ ] Display individual account details when expanded
- [ ] Persist state in session storage
- [ ] Add smooth transitions
- [ ] Ensure keyboard accessibility
- [ ] Set default collapsed state

---

### User Story 3.8: View Cashflow Sankey Diagram

**As a** user
**I want to** see a visual flow of my income and expenses
**So that** I can understand where my money comes from and goes

**Acceptance Criteria:**

- [ ] Dashboard displays a cashflow sankey diagram
- [ ] Diagram shows three layers:
  - [ ] Income categories (left side)
  - [ ] Central "Cash Flow" node
  - [ ] Expense categories (right side)
- [ ] Income flows from categories to cash flow node
- [ ] Expenses flow from cash flow node to categories
- [ ] If surplus exists, flows down to "Surplus" node
- [ ] Each flow shows:
  - [ ] Category name
  - [ ] Amount
  - [ ] Percentage of total
- [ ] Flows are proportional to amounts (thicker = larger)
- [ ] Categories are color-coded
- [ ] Hover shows detailed amounts and percentages
- [ ] Diagram is for selected period only
- [ ] Shows top-level categories only (not subcategories)

**Maybe App Reference:**

- Controller: `app/controllers/pages_controller.rb` (build_cashflow_sankey_data method, lines 60-154)
- Model: `app/models/income_statement.rb` (income and expense totals)
- JavaScript: `app/javascript/controllers/sankey_chart_controller.js` (D3-sankey)
- View: `app/views/pages/dashboard/_cashflow_sankey.html.erb`
- Database: `entries` table (transactions with categories)

**Tasks:**

- [ ] Fetch income by category for period
- [ ] Fetch expenses by category for period
- [ ] Calculate surplus (income - expenses)
- [ ] Build sankey data structure (nodes and links)
- [ ] Implement D3 sankey chart
- [ ] Create proportional flows
- [ ] Color code categories
- [ ] Add hover tooltips
- [ ] Handle empty data state
- [ ] Make chart responsive
- [ ] Filter to top-level categories only

---

### User Story 3.9: Select Period for Cashflow Diagram

**As a** user
**I want to** view cashflow for different time periods
**So that** I can analyze income/expenses over various timeframes

**Acceptance Criteria:**

- [ ] Cashflow section has its own period selector
- [ ] Available periods include:
  - [ ] Last 7 days
  - [ ] Last 30 days (default)
  - [ ] Last 90 days
  - [ ] Last 365 days
- [ ] Selecting period updates the cashflow diagram
- [ ] Period selector persists in URL
- [ ] Loading indicator shows during update
- [ ] Diagram recalculates income, expenses, and surplus
- [ ] Period can be different from net worth chart period

**Maybe App Reference:**

- Controller: `app/controllers/pages_controller.rb` (cashflow_period param handling)
- Model: `app/models/period.rb`

**Tasks:**

- [ ] Create period selector for cashflow
- [ ] Handle separate period param for cashflow
- [ ] Update diagram when period changes
- [ ] Persist selection in URL
- [ ] Recalculate income/expense totals
- [ ] Add loading states
- [ ] Allow independent period from net worth chart

---

### User Story 3.10: View Sync Status on Dashboard

**As a** user
**I want to** see if my accounts are currently syncing
**So that** I know when data is being updated

**Acceptance Criteria:**

- [ ] Dashboard shows sync status indicator
- [ ] During sync, indicator displays "Syncing..." with pulse animation
- [ ] After sync completes, indicator shows "Synced" with timestamp
- [ ] If sync fails, indicator shows error state
- [ ] Sync status updates in real-time without page refresh
- [ ] User can manually trigger sync from dashboard
- [ ] Dashboard data refreshes after sync completes

**Maybe App Reference:**

- Model: `app/models/balance_sheet/sync_status_monitor.rb`
- Database: `syncs` table (status: pending, syncing, completed, failed)
- Model: `app/models/concerns/syncable.rb`
- CSS: `animate-pulse` class for syncing indicator

**Tasks:**

- [ ] Create sync status indicator component
- [ ] Poll for sync status updates
- [ ] Display pulse animation during sync
- [ ] Show last sync timestamp
- [ ] Handle sync error states
- [ ] Implement manual sync trigger
- [ ] Refresh dashboard data after sync
- [ ] Use WebSocket or polling for real-time updates

---

### User Story 3.11: View Empty State

**As a** new user with no connected accounts
**I want to** see helpful guidance on the dashboard
**So that** I know what to do next

**Acceptance Criteria:**

- [ ] If no accounts connected, dashboard shows empty state
- [ ] Empty state explains what the dashboard will show
- [ ] Empty state displays clear call-to-action
- [ ] CTA button directs to "Connect Account" flow
- [ ] Alternative option to manually add account
- [ ] Empty state is visually appealing and encouraging
- [ ] Illustrations or graphics explain the dashboard features
- [ ] User can dismiss empty state guidance after first account added

**Maybe App Reference:**

- Views check if accounts exist and show different content
- Conditional rendering based on `@accounts.any?`

**Tasks:**

- [ ] Create empty state component
- [ ] Design illustration or graphic
- [ ] Add explanatory text
- [ ] Create CTA button linking to connection flow
- [ ] Add alternative action (manual account creation)
- [ ] Show feature preview
- [ ] Auto-hide after first account added

---

### User Story 3.12: Handle Multi-Currency Display

**As a** user with accounts in multiple currencies
**I want to** see all dashboard values in my primary currency
**So that** I have a unified view of my finances

**Acceptance Criteria:**

- [ ] All dashboard amounts display in user's primary currency
- [ ] Multi-currency accounts are converted using current exchange rates
- [ ] Historical data uses historical exchange rates for accuracy
- [ ] Currency symbol matches user's primary currency
- [ ] Conversion happens automatically in background
- [ ] User can see original currency in account details (drill-down)
- [ ] Exchange rates update daily
- [ ] Missing exchange rates handled gracefully

**Maybe App Reference:**

- Database: `exchange_rates` table (from_currency, to_currency, rate, date)
- Model: `app/models/exchange_rate.rb`
- Model: `app/models/balance/chart_series_builder.rb` (SQL includes exchange rate JOIN)
- Database: `accounts` table and `balances` table (currency field)

**Tasks:**

- [ ] Fetch user's primary currency from settings
- [ ] Query exchange rates for all account currencies
- [ ] Convert account balances using exchange rates
- [ ] Use historical rates for historical balance data
- [ ] Display all values in primary currency
- [ ] Store original currency for reference
- [ ] Handle missing exchange rates
- [ ] Update rates daily via background job
- [ ] Cache converted values for performance

---

### User Story 3.13: Cache Dashboard Data for Performance

**As a** system
**I want to** cache expensive dashboard calculations
**So that** the dashboard loads quickly

**Acceptance Criteria:**

- [ ] Net worth time series data is cached
- [ ] Balance sheet calculations are cached
- [ ] Cashflow data is cached
- [ ] Cache is invalidated when:
  - [ ] Account balances change
  - [ ] Transactions are added/modified
  - [ ] Sync completes
- [ ] Cache keys include user ID and period
- [ ] Cache has reasonable expiration (e.g., 1 hour)
- [ ] Cache misses don't cause errors
- [ ] Cache hit rate is monitored

**Maybe App Reference:**

- Caching: `Rails.cache.fetch(cache_key(period))` in net_worth_series_builder.rb
- Model: `app/models/family.rb` (build_cache_key method)
- Cache invalidation: Uses `latest_sync_completed_at` timestamp

**Tasks:**

- [ ] Implement caching layer (Redis, in-memory)
- [ ] Create cache keys with user + period
- [ ] Cache time series queries
- [ ] Cache balance sheet calculations
- [ ] Implement cache invalidation triggers
- [ ] Set appropriate TTL (time-to-live)
- [ ] Handle cache misses gracefully
- [ ] Monitor cache performance
- [ ] Add cache warming for common periods

---

## Feature 4: Rich Transaction Filtering, Searching, Bulk Updating, and Viewing

### User Story 4.1: View Transaction List

**As a** user
**I want to** see a list of all my transactions
**So that** I can review my financial activity

**Acceptance Criteria:**

- [ ] User can navigate to transactions page
- [ ] Transactions are displayed in a list/table format
- [ ] Each transaction row shows:
  - [ ] Transaction name/description
  - [ ] Transaction date
  - [ ] Category name (or "Uncategorized")
  - [ ] Amount with currency symbol
  - [ ] Account name (on hover or in details)
- [ ] Transactions are sorted by date (most recent first)
- [ ] Transactions are grouped by date (Today, Yesterday, specific dates)
- [ ] Each date group shows daily total income and expenses
- [ ] List is paginated (default 20 transactions per page)
- [ ] User can change items per page (20, 50, 100)
- [ ] Income transactions show as negative amounts (green)
- [ ] Expense transactions show as positive amounts (red)
- [ ] Transfer transactions are visually distinct
- [ ] Responsive layout (table on desktop, cards on mobile)
- [ ] Loading state while fetching transactions

**Maybe App Reference:**

- Database: `entries` table (name, date, amount, currency, account_id)
- Database: Polymorphic `entryable_type` = "Transaction"
- Routes: `resources :transactions, only: %i[index new create show update destroy]` (routes.rb:114)
- Controller: `app/controllers/transactions_controller.rb` (index action, lines 12-25)
- Model: `app/models/entry.rb` (base model for transactions)
- Model: `app/models/transaction.rb` (entryable type)
- View: `app/views/transactions/index.html.erb`
- Helper: `entries_by_date` helper for date grouping
- Pagination: Pagy gem (`@pagy, @transactions = pagy(base_scope, limit: per_page)`)

**Tasks:**

- [ ] Create transactions page/route
- [ ] Fetch transactions from API with pagination
- [ ] Display transaction list with date grouping
- [ ] Show transaction details (name, date, category, amount)
- [ ] Implement date-based sorting
- [ ] Group transactions by date
- [ ] Calculate and show daily totals
- [ ] Implement pagination controls
- [ ] Add per-page selector
- [ ] Color code income/expense/transfer
- [ ] Create responsive layout
- [ ] Add loading states
- [ ] Handle empty state

---

### User Story 4.2: Search Transactions by Text

**As a** user
**I want to** search for transactions by name
**So that** I can quickly find specific transactions

**Acceptance Criteria:**

- [ ] Search box is prominently displayed at top of transactions page
- [ ] User can type search query in text field
- [ ] Search is case-insensitive
- [ ] Search matches transaction names/descriptions
- [ ] Search results update automatically while typing (debounced)
- [ ] Search query is highlighted in results (optional)
- [ ] Search query persists in URL
- [ ] Clear button appears when search has value
- [ ] Clicking clear button resets search
- [ ] Empty search shows all transactions
- [ ] Search works with other filters (combined)
- [ ] Shows count of results
- [ ] No results shows empty state

**Maybe App Reference:**

- Model: `app/models/entry_search.rb` (apply_search_filter method, lines 15-23)
- SQL: `entries.name ILIKE :search` (case-insensitive search)
- Controller: `app/controllers/transactions_controller.rb` (search_params, line 144-159)
- View: `app/views/transactions/searches/_form.html.erb` (search input field)
- JavaScript: `app/javascript/controllers/auto_submit_form_controller.js` (auto-submit on type)

**Tasks:**

- [ ] Create search input component
- [ ] Implement debounced search (300-500ms)
- [ ] Send search query to API
- [ ] Filter transactions by name (case-insensitive)
- [ ] Update URL with search query
- [ ] Highlight search terms in results (optional)
- [ ] Add clear button
- [ ] Show result count
- [ ] Combine with other filters
- [ ] Handle empty results
- [ ] Persist search in session

---

### User Story 4.3: Filter Transactions by Account

**As a** user
**I want to** filter transactions by account
**So that** I can see transactions for specific accounts only

**Acceptance Criteria:**

- [ ] User can open account filter dropdown
- [ ] Dropdown shows list of all user's accounts
- [ ] User can select one or multiple accounts
- [ ] Each account shows account name and type
- [ ] Selected accounts are checkmarked
- [ ] Applying filter updates transaction list
- [ ] Selected accounts appear as filter badges/chips
- [ ] User can remove filter by clicking badge X
- [ ] Account filter persists in URL
- [ ] Filter works with other filters (combined)
- [ ] Shows count of selected accounts
- [ ] "Active accounts only" toggle available
- [ ] Archived accounts can be included optionally

**Maybe App Reference:**

- Model: `app/models/entry_search.rb` (apply_accounts_filter method, lines 51-58)
- Model: `app/models/transaction/search.rb` (accounts and account_ids attributes, lines 9-10)
- Controller: `app/controllers/transactions_controller.rb` (search_params permits accounts, account_ids)
- View: `app/views/transactions/searches/filters/_account_filter.html.erb`
- Helper: `app/helpers/transactions_helper.rb` (transaction_search_filters)
- Database: Joins with `accounts` table

**Tasks:**

- [ ] Create account filter dropdown
- [ ] Fetch all accounts for user
- [ ] Implement multi-select checkboxes
- [ ] Filter transactions by account IDs
- [ ] Display selected accounts as badges
- [ ] Add remove badge functionality
- [ ] Persist filter in URL
- [ ] Add "Active accounts only" toggle
- [ ] Combine with other filters
- [ ] Show account count in filter button

---

### User Story 4.4: Filter Transactions by Date Range

**As a** user
**I want to** filter transactions by date range
**So that** I can view transactions for specific time periods

**Acceptance Criteria:**

- [ ] User can open date filter dropdown
- [ ] User can select start date
- [ ] User can select end date
- [ ] Date pickers show calendar interface
- [ ] User can select predefined ranges:
  - [ ] Today
  - [ ] Last 7 days
  - [ ] Last 30 days
  - [ ] Last 90 days
  - [ ] This month
  - [ ] Last month
  - [ ] This year
  - [ ] Custom range
- [ ] Applying date filter updates transaction list
- [ ] Selected date range appears as filter badge
- [ ] User can remove date filter by clicking badge X
- [ ] Date filter persists in URL
- [ ] Start date cannot be after end date
- [ ] Filter works with other filters (combined)

**Maybe App Reference:**

- Model: `app/models/entry_search.rb` (apply_date_filters method, lines 25-32)
- Model: `app/models/transaction/search.rb` (start_date, end_date attributes, lines 11-12)
- SQL: `entries.date >= ?` and `entries.date <= ?`
- View: `app/views/transactions/searches/filters/_date_filter.html.erb`

**Tasks:**

- [ ] Create date range filter component
- [ ] Implement date picker inputs
- [ ] Add predefined range shortcuts
- [ ] Validate start date < end date
- [ ] Filter transactions by date range
- [ ] Display date range as badge
- [ ] Add remove badge functionality
- [ ] Persist filter in URL
- [ ] Format dates according to user preference
- [ ] Combine with other filters

---

### User Story 4.5: Filter Transactions by Type

**As a** user
**I want to** filter transactions by type (income, expense, transfer)
**So that** I can analyze specific types of financial activity

**Acceptance Criteria:**

- [ ] User can open type filter dropdown
- [ ] Available types include:
  - [ ] Income
  - [ ] Expense
  - [ ] Transfer
- [ ] User can select one or multiple types
- [ ] Selected types are checkmarked
- [ ] Applying filter updates transaction list
- [ ] Selected types appear as filter badges
- [ ] User can remove filter by clicking badge X
- [ ] Type filter persists in URL
- [ ] Filter works with other filters (combined)
- [ ] Income: transactions with amount < 0 (excluding transfers)
- [ ] Expense: transactions with amount >= 0 (excluding transfers)
- [ ] Transfer: fund movements, credit card payments, loan payments

**Maybe App Reference:**

- Model: `app/models/transaction/search.rb` (apply_type_filter method, lines 108-132)
- Logic: Complex SQL conditions based on `entries.amount` and `transactions.kind`
- Transfer types: `kind IN ('funds_movement', 'cc_payment', 'loan_payment')`
- View: `app/views/transactions/searches/filters/_type_filter.html.erb`

**Tasks:**

- [ ] Create type filter dropdown
- [ ] Implement multi-select checkboxes
- [ ] Define income/expense/transfer logic
- [ ] Filter transactions by type
- [ ] Display selected types as badges
- [ ] Add remove badge functionality
- [ ] Persist filter in URL
- [ ] Combine with other filters
- [ ] Handle edge cases (transfers, payments)

---

### User Story 4.6: Filter Transactions by Amount

**As a** user
**I want to** filter transactions by amount
**So that** I can find transactions above, below, or equal to specific amounts

**Acceptance Criteria:**

- [ ] User can open amount filter dropdown
- [ ] User can enter amount value
- [ ] User can select operator:
  - [ ] Equal to
  - [ ] Greater than
  - [ ] Less than
- [ ] Amount filter works on absolute value (ignores income/expense sign)
- [ ] Applying filter updates transaction list
- [ ] Amount filter appears as badge (e.g., "> $100")
- [ ] User can remove filter by clicking badge X
- [ ] Amount filter persists in URL
- [ ] Filter works with other filters (combined)
- [ ] Amount respects user's currency
- [ ] Validates numeric input

**Maybe App Reference:**

- Model: `app/models/entry_search.rb` (apply_amount_filter method, lines 34-49)
- Model: `app/models/transaction/search.rb` (amount, amount_operator attributes, lines 6-7)
- SQL: `ABS(entries.amount)` comparisons
- Operators: "equal", "less", "greater"
- Tolerance: Equal uses 0.01 tolerance for floating point comparison
- View: `app/views/transactions/searches/filters/_amount_filter.html.erb`

**Tasks:**

- [ ] Create amount filter component
- [ ] Add amount input field
- [ ] Add operator selector (equal, greater, less)
- [ ] Validate numeric input
- [ ] Filter by absolute amount value
- [ ] Display amount filter as badge
- [ ] Format amount with currency
- [ ] Add remove badge functionality
- [ ] Persist filter in URL
- [ ] Combine with other filters

---

### User Story 4.7: Filter Transactions by Category

**As a** user
**I want to** filter transactions by category
**So that** I can analyze spending in specific categories

**Acceptance Criteria:**

- [ ] User can open category filter dropdown
- [ ] Dropdown shows list of all categories
- [ ] Categories are organized by income/expense
- [ ] User can select one or multiple categories
- [ ] "Uncategorized" option is available
- [ ] Selected categories are checkmarked
- [ ] Applying filter updates transaction list
- [ ] Selected categories appear as filter badges
- [ ] Each badge shows category color
- [ ] User can remove filter by clicking badge X
- [ ] Category filter persists in URL
- [ ] Filter works with other filters (combined)
- [ ] Shows only categories user has created/used

**Maybe App Reference:**

- Database: `categories` table (name, color, classification)
- Model: `app/models/category.rb`
- Model: `app/models/transaction/search.rb` (apply_category_filter method, lines 91-106)
- SQL: Joins with categories, handles uncategorized (`category_id IS NULL`)
- View: `app/views/transactions/searches/filters/_category_filter.html.erb`

**Tasks:**

- [ ] Create category filter dropdown
- [ ] Fetch all categories for user
- [ ] Group by income/expense
- [ ] Implement multi-select checkboxes
- [ ] Add "Uncategorized" option
- [ ] Filter transactions by category
- [ ] Display selected categories as badges
- [ ] Show category colors in badges
- [ ] Add remove badge functionality
- [ ] Persist filter in URL
- [ ] Combine with other filters

---

### User Story 4.8: Filter Transactions by Tag

**As a** user
**I want to** filter transactions by tags
**So that** I can find transactions with specific labels

**Acceptance Criteria:**

- [ ] User can open tag filter dropdown
- [ ] Dropdown shows list of all tags
- [ ] User can select one or multiple tags
- [ ] Selected tags are checkmarked
- [ ] Applying filter updates transaction list
- [ ] Selected tags appear as filter badges
- [ ] User can remove filter by clicking badge X
- [ ] Tag filter persists in URL
- [ ] Filter works with other filters (combined)
- [ ] Filters to transactions that have ALL selected tags (AND logic)
- [ ] Shows only tags user has created

**Maybe App Reference:**

- Database: `tags` table, `taggings` join table
- Model: `app/models/tag.rb`
- Model: `app/models/transaction/search.rb` (apply_tag_filter method, lines 139-142)
- SQL: Joins with tags through taggings
- View: `app/views/transactions/searches/filters/_tag_filter.html.erb`

**Tasks:**

- [ ] Create tag filter dropdown
- [ ] Fetch all tags for user
- [ ] Implement multi-select checkboxes
- [ ] Filter transactions by tags (JOIN query)
- [ ] Display selected tags as badges
- [ ] Add remove badge functionality
- [ ] Persist filter in URL
- [ ] Combine with other filters
- [ ] Handle AND logic for multiple tags

---

### User Story 4.9: Filter Transactions by Merchant

**As a** user
**I want to** filter transactions by merchant
**So that** I can see all transactions from specific vendors

**Acceptance Criteria:**

- [ ] User can open merchant filter dropdown
- [ ] Dropdown shows list of all merchants
- [ ] Merchants are sorted alphabetically
- [ ] User can select one or multiple merchants
- [ ] Selected merchants are checkmarked
- [ ] Applying filter updates transaction list
- [ ] Selected merchants appear as filter badges
- [ ] User can remove filter by clicking badge X
- [ ] Merchant filter persists in URL
- [ ] Filter works with other filters (combined)
- [ ] Shows only merchants that have been assigned to transactions

**Maybe App Reference:**

- Database: `merchants` table (name, type: FamilyMerchant or ProviderMerchant)
- Model: `app/models/merchant.rb`
- Model: `app/models/transaction/search.rb` (apply_merchant_filter method, lines 134-137)
- SQL: Joins with merchants, filters by name
- View: `app/views/transactions/searches/filters/_merchant_filter.html.erb`

**Tasks:**

- [ ] Create merchant filter dropdown
- [ ] Fetch all merchants for user
- [ ] Sort merchants alphabetically
- [ ] Implement multi-select checkboxes
- [ ] Filter transactions by merchant
- [ ] Display selected merchants as badges
- [ ] Add remove badge functionality
- [ ] Persist filter in URL
- [ ] Combine with other filters

---

### User Story 4.10: View Filter Summary and Clear Filters

**As a** user
**I want to** see all active filters and clear them
**So that** I can understand what filters are applied and start fresh

**Acceptance Criteria:**

- [ ] All active filters display as badges/chips above transaction list
- [ ] Each badge shows filter type and value (e.g., "Category: Food")
- [ ] Each badge has an X button to remove that specific filter
- [ ] Clicking X on badge removes only that filter
- [ ] "Clear all filters" button appears when filters are active
- [ ] Clicking "Clear all" removes all filters
- [ ] Filter count shows in filter button (e.g., "Filter (3)")
- [ ] Filter summary is always visible when filters active
- [ ] Removing filters updates transaction list
- [ ] URL updates when filters are removed

**Maybe App Reference:**

- View: `app/views/transactions/searches/_search.html.erb` (shows filter badges, lines 3-25)
- Controller: `app/controllers/transactions_controller.rb` (clear_filter action, lines 27-54)
- Route: `DELETE /transactions/clear_filter` with param_key and param_value
- Session: Stores previous filter params in `prev_transaction_page_params`

**Tasks:**

- [ ] Display all active filters as badges
- [ ] Add remove button to each badge
- [ ] Implement individual filter removal
- [ ] Add "Clear all filters" button
- [ ] Update transaction list when filters removed
- [ ] Update URL when filters removed
- [ ] Show filter count in filter button
- [ ] Handle array-type filters (multi-select)
- [ ] Persist filter state in session

---

### User Story 4.11: View Transaction Totals for Filtered Results

**As a** user
**I want to** see total income and expenses for filtered transactions
**So that** I can understand the financial impact of the filtered set

**Acceptance Criteria:**

- [ ] Summary section displays above transaction list
- [ ] Summary shows:
  - [ ] Total number of transactions
  - [ ] Total income amount
  - [ ] Total expense amount
- [ ] Totals update when filters change
- [ ] Amounts are in user's primary currency
- [ ] Multi-currency transactions are converted
- [ ] Transfers are excluded from income/expense totals
- [ ] Summary is always visible
- [ ] Totals are cached for performance

**Maybe App Reference:**

- Model: `app/models/transaction/search.rb` (totals method, lines 44-69)
- Calculation: Complex SQL with CASE statements for income/expense
- SQL: Uses exchange rates for multi-currency: `COALESCE(er.rate, 1)`
- Excludes: `kind NOT IN ('funds_movement', 'cc_payment')`
- Cache: `Rails.cache.fetch("transaction_search_totals/#{cache_key_base}")`
- View: `app/views/transactions/_summary.html.erb`

**Tasks:**

- [ ] Create summary component
- [ ] Calculate total transaction count
- [ ] Calculate total income (SUM of negative amounts)
- [ ] Calculate total expenses (SUM of positive amounts)
- [ ] Exclude transfers from totals
- [ ] Convert multi-currency amounts
- [ ] Display totals prominently
- [ ] Update totals when filters change
- [ ] Cache totals for performance
- [ ] Format amounts with currency

---

### User Story 4.12: Pagination Controls

**As a** user
**I want to** navigate through pages of transactions
**So that** I can browse large transaction lists efficiently

**Acceptance Criteria:**

- [ ] Pagination controls appear at bottom of transaction list
- [ ] Shows current page number
- [ ] Shows total number of pages
- [ ] Shows total number of transactions
- [ ] Previous/Next buttons available
- [ ] Previous button disabled on first page
- [ ] Next button disabled on last page
- [ ] User can jump to specific page number
- [ ] User can change items per page (20, 50, 100)
- [ ] Page number persists in URL
- [ ] Per-page setting persists in session
- [ ] Pagination state maintained with filters

**Maybe App Reference:**

- Pagination: Pagy gem
- Controller: `@pagy, @transactions = pagy(base_scope, limit: per_page)` (transactions_controller.rb:24)
- Method: `per_page` method checks params or defaults to 20 (lines 112-114)
- View: `app/views/shared/_pagination.html.erb`
- Params: `params[:page]` and `params[:per_page]`

**Tasks:**

- [ ] Implement pagination library
- [ ] Add pagination controls to UI
- [ ] Show page info (current, total, count)
- [ ] Add Previous/Next buttons
- [ ] Disable buttons at boundaries
- [ ] Add page number selector
- [ ] Add per-page selector
- [ ] Persist page in URL
- [ ] Persist per-page in session
- [ ] Maintain pagination with filters

---

### User Story 4.13: Select Transactions for Bulk Actions

**As a** user
**I want to** select multiple transactions
**So that** I can perform bulk operations

**Acceptance Criteria:**

- [ ] Each transaction row has a checkbox
- [ ] Checkbox in table header selects/deselects all visible transactions
- [ ] User can select individual transactions
- [ ] User can select all transactions on current page
- [ ] Selected count displays (e.g., "3 transactions selected")
- [ ] Selection bar appears when transactions are selected
- [ ] Selection bar shows count and bulk action buttons
- [ ] Selection persists while navigating same page
- [ ] Selection clears when navigating to different page
- [ ] Selection clears after bulk action completes
- [ ] Visual indicator shows selected rows (background color)
- [ ] Keyboard support (Shift+Click for range selection)

**Maybe App Reference:**

- JavaScript: `app/javascript/controllers/bulk_select_controller.js`
- View: `app/views/transactions/index.html.erb` (bulk-select controller, lines 48-56)
- View: `app/views/transactions/_selection_bar.html.erb`
- Checkboxes have `data-action="bulk-select#togglePageSelection"`
- Selection data stored in Stimulus controller targets

**Tasks:**

- [ ] Add checkboxes to transaction rows
- [ ] Add select-all checkbox in header
- [ ] Implement selection state management
- [ ] Track selected transaction IDs
- [ ] Display selection count
- [ ] Show/hide selection bar based on selection
- [ ] Highlight selected rows
- [ ] Clear selection after actions
- [ ] Add keyboard support (Shift+Click)
- [ ] Maintain selection within page

---

### User Story 4.14: Bulk Update Transactions

**As a** user
**I want to** update multiple transactions at once
**So that** I can efficiently categorize and organize transactions

**Acceptance Criteria:**

- [ ] After selecting transactions, user can click "Edit" button
- [ ] Bulk edit drawer/modal opens
- [ ] User can update:
  - [ ] Category
  - [ ] Merchant
  - [ ] Tags (add/remove)
  - [ ] Date
  - [ ] Notes
- [ ] Only selected fields are updated (partial update)
- [ ] User can leave fields blank to skip updating them
- [ ] Preview shows count of transactions to be updated
- [ ] User confirms bulk update
- [ ] System updates all selected transactions
- [ ] Success message shows count of updated transactions
- [ ] Transaction list refreshes with updates
- [ ] Selection clears after update
- [ ] Failed updates show error message

**Maybe App Reference:**

- Routes: `resources :bulk_updates, only: %i[new create]` under transactions (routes.rb:116)
- Controller: `app/controllers/transactions/bulk_updates_controller.rb`
- Method: `Entry.bulk_update!(bulk_update_params)` (entry.rb:73-97)
- Params: date, notes, category_id, merchant_id, tag_ids, entry_ids
- Transaction: Wrapped in database transaction for atomicity
- View: `app/views/transactions/bulk_updates/new.html.erb`

**Tasks:**

- [ ] Create bulk edit modal/drawer
- [ ] Add form fields for bulk update
- [ ] Allow partial updates (only filled fields)
- [ ] Collect selected transaction IDs
- [ ] Validate bulk update data
- [ ] Execute bulk update on server
- [ ] Use database transaction for atomicity
- [ ] Show progress indicator
- [ ] Display success message with count
- [ ] Refresh transaction list
- [ ] Clear selection
- [ ] Handle errors gracefully

---

### User Story 4.15: Bulk Delete Transactions

**As a** user
**I want to** delete multiple transactions at once
**So that** I can quickly remove unwanted transactions

**Acceptance Criteria:**

- [ ] After selecting transactions, user can click "Delete" button
- [ ] Confirmation dialog appears
- [ ] Dialog shows count of transactions to be deleted
- [ ] Dialog warns that action cannot be undone
- [ ] User must confirm deletion
- [ ] User can cancel deletion
- [ ] System deletes all selected transactions
- [ ] Success message shows count of deleted transactions
- [ ] Transaction list refreshes
- [ ] Deleted transactions no longer appear in list
- [ ] Account balances are recalculated after deletion
- [ ] Selection clears after deletion

**Maybe App Reference:**

- Routes: `resource :bulk_deletion, only: :create` under transactions (routes.rb:117)
- Controller: `app/controllers/transactions/bulk_deletions_controller.rb`
- Method: `Current.family.entries.destroy_by(id: bulk_delete_params[:entry_ids])` (line 3)
- Callback: Triggers `sync_account_later` for affected accounts (line 4)
- View: `app/views/transactions/_selection_bar.html.erb` (delete button with turbo_confirm)

**Tasks:**

- [ ] Add bulk delete button to selection bar
- [ ] Create confirmation dialog
- [ ] Show transaction count in dialog
- [ ] Warn about permanent deletion
- [ ] Collect selected transaction IDs
- [ ] Execute bulk delete on server
- [ ] Trigger account balance recalculation
- [ ] Display success message with count
- [ ] Refresh transaction list
- [ ] Clear selection
- [ ] Handle errors (e.g., permission denied)

---

### User Story 4.16: View Individual Transaction Details

**As a** user
**I want to** click on a transaction to view its details
**So that** I can see all information about a specific transaction

**Acceptance Criteria:**

- [ ] User can click on transaction row to open details
- [ ] Details open in a drawer/modal from the side or bottom
- [ ] Details show all transaction information:
  - [ ] Name/description
  - [ ] Date
  - [ ] Amount and currency
  - [ ] Income/Expense indicator
  - [ ] Category
  - [ ] Account
  - [ ] Merchant
  - [ ] Tags
  - [ ] Notes
- [ ] Details show transaction metadata:
  - [ ] Created date
  - [ ] Last modified date
  - [ ] Sync status (if from Plaid)
- [ ] User can close details drawer
- [ ] Drawer can be navigated with keyboard (Escape to close)
- [ ] Details are read-only initially, with Edit mode

**Maybe App Reference:**

- Routes: `resources :transactions` includes show action
- Controller: `app/controllers/transactions_controller.rb` (show action through EntryableResource concern)
- View: `app/views/transactions/show.html.erb`
- Component: Uses DS::Dialog (drawer variant)
- Sections: Overview, Details, Settings
- Model: `@entry` loaded with associations

**Tasks:**

- [ ] Create transaction details drawer/modal
- [ ] Fetch transaction details from API
- [ ] Display all transaction fields
- [ ] Show transaction metadata
- [ ] Add close button
- [ ] Implement keyboard navigation (Escape)
- [ ] Handle loading states
- [ ] Make drawer responsive
- [ ] Show sync status for linked transactions
- [ ] Prepare for edit mode

---

### User Story 4.17: Edit Transaction Details

**As a** user
**I want to** edit transaction details inline
**So that** I can correct or update transaction information

**Acceptance Criteria:**

- [ ] All editable fields can be modified in details drawer
- [ ] Editable fields include:
  - [ ] Name
  - [ ] Date
  - [ ] Amount (for unlinked transactions)
  - [ ] Income/Expense toggle
  - [ ] Currency (for unlinked transactions)
  - [ ] Category
  - [ ] Merchant
  - [ ] Tags
  - [ ] Notes
- [ ] Linked transactions (from Plaid) have restricted editing:
  - [ ] Name can be edited
  - [ ] Date cannot be edited
  - [ ] Amount cannot be edited
  - [ ] Category can be edited
  - [ ] Merchant can be edited
  - [ ] Tags can be edited
  - [ ] Notes can be edited
- [ ] Changes are saved automatically (auto-submit)
- [ ] Visual feedback shows field is being saved
- [ ] Success confirmation after save
- [ ] Validation errors show inline
- [ ] User can revert changes before save

**Maybe App Reference:**

- Controller: `app/controllers/transactions_controller.rb` (update action, lines 76-109)
- View: `app/views/transactions/show.html.erb` (multiple forms with auto-submit)
- JavaScript: `app/javascript/controllers/auto_submit_form_controller.js`
- Forms: `data-controller="auto-submit-form"` and `data-auto-submit-form-target="auto"`
- Update: Uses Turbo Stream to update UI without full page reload
- Validation: `render :show, status: :unprocessable_entity` on error

**Tasks:**

- [ ] Make fields editable in drawer
- [ ] Implement auto-submit on field change
- [ ] Add debouncing to prevent excessive saves
- [ ] Validate field values
- [ ] Show saving indicator
- [ ] Display success feedback
- [ ] Show inline validation errors
- [ ] Restrict editing for linked transactions
- [ ] Update UI optimistically
- [ ] Trigger account sync after update

---

### User Story 4.18: Categorize Transaction

**As a** user
**I want to** assign a category to a transaction
**So that** I can organize my spending and income

**Acceptance Criteria:**

- [ ] User can select category from dropdown
- [ ] Dropdown shows all income categories for income transactions
- [ ] Dropdown shows all expense categories for expense transactions
- [ ] Categories are sorted alphabetically
- [ ] Parent and subcategories are shown hierarchically
- [ ] "Uncategorized" option is available
- [ ] Selected category is saved immediately
- [ ] Category change triggers account sync
- [ ] System suggests creating a rule if appropriate
- [ ] User can create new category from dropdown (optional)

**Maybe App Reference:**

- Controller: `app/controllers/transactions_controller.rb` (update action)
- Logic: `needs_rule_notification?` checks if rule prompt should show (lines 116-126)
- Flash: Shows CTA for creating category rule after categorization
- View: `app/views/transactions/show.html.erb` (category select field, lines 40-47)
- Model: `app/models/category.rb` (incomes/expenses scopes)

**Tasks:**

- [ ] Create category selector component
- [ ] Fetch categories filtered by income/expense
- [ ] Display hierarchical categories
- [ ] Allow uncategorized selection
- [ ] Save category immediately on change
- [ ] Trigger account sync after save
- [ ] Suggest rule creation after categorization
- [ ] Show success feedback
- [ ] Handle validation errors

---

### User Story 4.19: Add Tags to Transaction

**As a** user
**I want to** add tags to a transaction
**So that** I can label and organize transactions in flexible ways

**Acceptance Criteria:**

- [ ] User can select multiple tags from dropdown
- [ ] Dropdown shows all available tags
- [ ] Tags are sorted alphabetically
- [ ] User can select multiple tags
- [ ] User can deselect tags
- [ ] Selected tags are saved immediately
- [ ] User can create new tag from dropdown (optional)
- [ ] Tags display as colored chips/badges
- [ ] Tag changes trigger account sync

**Maybe App Reference:**

- View: `app/views/transactions/show.html.erb` (tags multi-select, lines 79-87)
- Model: `app/models/tag.rb`
- Database: `taggings` join table (polymorphic taggable)
- Update: `lock_attr!(:tag_ids)` after update (transactions_controller.rb:90)

**Tasks:**

- [ ] Create multi-select tag component
- [ ] Fetch all tags for user
- [ ] Allow multiple tag selection
- [ ] Save tags immediately on change
- [ ] Display tags as chips/badges
- [ ] Allow tag creation (optional)
- [ ] Trigger account sync after save
- [ ] Show success feedback

---

### User Story 4.20: Add Merchant to Transaction

**As a** user
**I want to** assign a merchant to a transaction
**So that** I can track spending by vendor

**Acceptance Criteria:**

- [ ] User can select merchant from dropdown
- [ ] Dropdown shows all merchants alphabetically
- [ ] User can clear merchant selection (set to none)
- [ ] Selected merchant is saved immediately
- [ ] User can create new merchant from dropdown (optional)
- [ ] System may auto-detect merchant from transaction name
- [ ] Merchant change triggers account sync

**Maybe App Reference:**

- View: `app/views/transactions/show.html.erb` (merchant select, lines 71-77)
- Model: `app/models/merchant.rb`
- Types: FamilyMerchant (user-created) and ProviderMerchant (from Plaid)
- Auto-detection: Merchant detection via rules (future feature)

**Tasks:**

- [ ] Create merchant selector component
- [ ] Fetch all merchants for user
- [ ] Sort merchants alphabetically
- [ ] Allow merchant selection/clearing
- [ ] Save merchant immediately on change
- [ ] Allow merchant creation (optional)
- [ ] Trigger account sync after save
- [ ] Show success feedback

---

### User Story 4.21: Exclude Transaction from Reports

**As a** user
**I want to** exclude specific transactions from budget calculations
**So that** one-time or irregular transactions don't skew my reports

**Acceptance Criteria:**

- [ ] User can toggle "Excluded" setting in transaction details
- [ ] Excluded transactions are visually marked (grayed out or badge)
- [ ] Excluded transactions don't count toward budget calculations
- [ ] Excluded transactions don't appear in reports
- [ ] Excluded transactions still appear in transaction list
- [ ] User can filter to show/hide excluded transactions
- [ ] Excluded state is saved immediately
- [ ] User can bulk exclude multiple transactions

**Maybe App Reference:**

- Database: `entries` table (excluded boolean field)
- View: `app/views/transactions/show.html.erb` (excluded toggle, lines 107-114)
- Description: "Excluded transactions will be removed from budgeting calculations and reports"
- Update: Auto-submit form for excluded toggle

**Tasks:**

- [ ] Add excluded toggle to transaction details
- [ ] Save excluded state immediately
- [ ] Mark excluded transactions visually
- [ ] Exclude from budget calculations
- [ ] Exclude from reports
- [ ] Add filter for excluded transactions
- [ ] Support bulk exclude operation
- [ ] Show success feedback

---

### User Story 4.22: Mark Transaction as One-Time

**As a** user
**I want to** mark transactions as one-time expenses/income
**So that** they're treated differently in budgeting and forecasting

**Acceptance Criteria:**

- [ ] User can toggle "One-time" setting in transaction details
- [ ] One-time setting label changes based on income/expense (expense/income)
- [ ] Description explains impact on budgeting
- [ ] One-time transactions are excluded from certain calculations
- [ ] One-time state is saved immediately
- [ ] User can filter to show/hide one-time transactions
- [ ] User can bulk mark transactions as one-time

**Maybe App Reference:**

- Database: `transactions` table (kind field: "standard" or "one_time")
- View: `app/views/transactions/show.html.erb` (one-time toggle, lines 125-136)
- Description: "One-time transactions will be excluded from certain budgeting calculations and reports to help you see what's really important"
- Toggle values: "one_time" or "standard"

**Tasks:**

- [ ] Add one-time toggle to transaction details
- [ ] Change label based on income/expense
- [ ] Save kind immediately
- [ ] Exclude from recurring budget calculations
- [ ] Add filter for one-time transactions
- [ ] Support bulk one-time marking
- [ ] Show success feedback

---

### User Story 4.23: Delete Individual Transaction

**As a** user
**I want to** delete a transaction
**So that** I can remove errors or duplicate entries

**Acceptance Criteria:**

- [ ] User can click delete button in transaction details
- [ ] Confirmation dialog appears warning about permanent deletion
- [ ] Dialog explains historical data will be removed
- [ ] User must confirm deletion
- [ ] User can cancel deletion
- [ ] Transaction is permanently deleted
- [ ] Account balance is recalculated
- [ ] User is redirected to transaction list
- [ ] Success message confirms deletion
- [ ] Deleted transaction no longer appears

**Maybe App Reference:**

- Routes: `resources :transactions` includes destroy action
- View: `app/views/transactions/show.html.erb` (delete button, lines 160-167)
- Confirmation: `CustomConfirm.for_resource_deletion("transaction")`
- Delete: `DELETE` request with turbo_frame="_top"
- Section: Delete in Settings section of drawer

**Tasks:**

- [ ] Add delete button to transaction details
- [ ] Create confirmation dialog
- [ ] Warn about permanent deletion
- [ ] Execute delete on server
- [ ] Trigger account balance recalculation
- [ ] Redirect to transaction list
- [ ] Show success message
- [ ] Handle errors (e.g., permission denied)

---

### User Story 4.24: Match Transfers Between Accounts

**As a** user
**I want to** link related transactions as transfers
**So that** money movements between my accounts are properly tracked

**Acceptance Criteria:**

- [ ] User can open transfer matcher from transaction details
- [ ] System suggests potential matching transactions:
  - [ ] Similar amounts (within tolerance)
  - [ ] Similar dates (within date range)
  - [ ] Opposite signs (inflow/outflow)
  - [ ] Different accounts
- [ ] User can manually search for matching transaction
- [ ] User can confirm transfer match
- [ ] Matched transactions are linked as transfer pair
- [ ] Both transactions marked as transfer type
- [ ] Transfer transactions excluded from income/expense totals
- [ ] User can unlink transfer later if needed
- [ ] Automatic transfer detection (optional)

**Maybe App Reference:**

- Database: `transfers` table, `entries.transfer_id` foreign key
- Routes: `resources :transfer_matches, only: %i[new create destroy]` under transactions
- View: `app/views/transactions/show.html.erb` (transfer matcher link, lines 143-150)
- Description: "Transfers and payments are special types of transactions that indicate money movement between 2 accounts"

**Tasks:**

- [ ] Create transfer matcher modal
- [ ] Find potential matches (amount, date, account)
- [ ] Display suggested matches
- [ ] Allow manual search
- [ ] Link transactions as transfer pair
- [ ] Mark as transfer type
- [ ] Exclude from income/expense calculations
- [ ] Allow unlinking transfers
- [ ] Implement automatic detection (optional)

---

### User Story 4.25: Persist Transaction Search State

**As a** user
**I want to** my search and filter settings to persist
**So that** I don't lose my view when navigating away and back

**Acceptance Criteria:**

- [ ] Search query persists in URL
- [ ] All filter selections persist in URL
- [ ] Page number persists in URL
- [ ] Per-page setting persists in session
- [ ] When returning to transactions page, previous filters are restored
- [ ] Filters can be shared via URL
- [ ] Filters clear only when explicitly requested
- [ ] Empty URL loads default view (no filters, page 1)
- [ ] User can bookmark filtered views

**Maybe App Reference:**

- Controller: `app/controllers/transactions_controller.rb` (store_params! method, lines 161-179)
- Session: `Current.session.prev_transaction_page_params` stores last state
- Logic: `should_restore_params?` checks if URL is empty and session has stored params
- Redirect: Redirects to stored params on empty query string
- Params: Stores q (search), page, per_page

**Tasks:**

- [ ] Store all filter params in URL query string
- [ ] Store per-page setting in session/localStorage
- [ ] Check for empty URL on page load
- [ ] Restore previous filters if URL is empty
- [ ] Allow manual clearing of all filters
- [ ] Ensure filters are shareable via URL
- [ ] Handle edge cases (invalid params)
- [ ] Clear session when explicitly requested

---

#Features

Connect your bank accounts using Plaid
Dashboard to see your net worth trend over time and current personal balance sheet
Rich transaction filtering, searching, bulk updating, and viewing
Account views with the ability to see balance trends, reconciliations, and detailed breakdowns of your balance changes
View your monthly budgets with category averages, income summary, and more
Intelligent AI chat that knows your finances and can answer questions about them
Multi-currency support
API with key management to build automations on top of Maybe
Categories, Tags, Merchants
Rules to auto-categorize your transactions, detect merchants, and more
Invite members to your household

#Principles:

Most people need to know just a few important things about their finances:

How much money do I have?
Am I spending less than I’m earning?
How much did I spend last month?
What am I spending my money on?
This app answers all of those questions and gives the user a simple interface to categorize, organize, and get to those answers quicker. While some users might look for a richer feature set, we believe most users are satisfied with less; not more.
