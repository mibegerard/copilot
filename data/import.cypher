// =============================================
// Fintech System Data Import Script (Optimized)
// Neo4j Cypher File - Version 1.3
// =============================================

// --------------------------
// 1. Parameter Configuration
// --------------------------
:param {
  // Core Entities
  account: "https://raw.githubusercontent.com/mibegerard/copilot/refs/heads/main/data/account.csv",
  customer: "https://raw.githubusercontent.com/mibegerard/copilot/refs/heads/main/data/customer.csv",
  balance: "https://raw.githubusercontent.com/mibegerard/copilot/refs/heads/main/data/balance.csv",
  component: "https://raw.githubusercontent.com/mibegerard/copilot/refs/heads/main/data/component.csv",
  smartContract: "https://raw.githubusercontent.com/mibegerard/copilot/refs/heads/main/data/smartContract.csv",
  product: "https://raw.githubusercontent.com/mibegerard/copilot/refs/heads/main/data/product.csv",
  productVersion: "https://raw.githubusercontent.com/mibegerard/copilot/refs/heads/main/data/productVersion.csv",
  vault: "https://raw.githubusercontent.com/mibegerard/copilot/refs/heads/main/data/vault.csv",
  hook: "https://raw.githubusercontent.com/mibegerard/copilot/refs/heads/main/data/hook.csv",
  postingInstructionBatch: "https://raw.githubusercontent.com/mibegerard/copilot/refs/heads/main/data/postingInstructionBatch.csv",
  
  // Relationships
  associated_with: "https://raw.githubusercontent.com/mibegerard/copilot/refs/heads/main/data/associated_with.csv",
  has_balance: "https://raw.githubusercontent.com/mibegerard/copilot/refs/heads/main/data/has_balance.csv",
  backed: "https://raw.githubusercontent.com/mibegerard/copilot/refs/heads/main/data/backed.csv",
  defines: "https://raw.githubusercontent.com/mibegerard/copilot/refs/heads/main/data/defines.csv",
  has_component: "https://raw.githubusercontent.com/mibegerard/copilot/refs/heads/main/data/has_component.csv",
  part_of: "https://raw.githubusercontent.com/mibegerard/copilot/refs/heads/main/data/part_of.csv",
  uses: "https://raw.githubusercontent.com/mibegerard/copilot/refs/heads/main/data/uses.csv",
  has_version: "https://raw.githubusercontent.com/mibegerard/copilot/refs/heads/main/data/has_version.csv"
};

// ----------------------
// 2. Schema Constraints
// ----------------------
CREATE CONSTRAINT Account_id_unique IF NOT EXISTS FOR (n:Account) REQUIRE n.account_id IS UNIQUE;
CREATE CONSTRAINT Customer_id_unique IF NOT EXISTS FOR (n:Customer) REQUIRE n.customer_id IS UNIQUE;
CREATE CONSTRAINT Balance_id_unique IF NOT EXISTS FOR (n:Balance) REQUIRE n.balance_id IS UNIQUE;
CREATE CONSTRAINT Component_id_unique IF NOT EXISTS FOR (n:Component) REQUIRE n.component_id IS UNIQUE;
CREATE CONSTRAINT Contract_id_unique IF NOT EXISTS FOR (n:Contract) REQUIRE n.contract_id IS UNIQUE;
CREATE CONSTRAINT Product_id_unique IF NOT EXISTS FOR (n:Product) REQUIRE n.product_id IS UNIQUE;
CREATE CONSTRAINT ProductVersion_id_unique IF NOT EXISTS FOR (n:ProductVersion) REQUIRE n.product_version_id IS UNIQUE;
CREATE CONSTRAINT Vault_id_unique IF NOT EXISTS FOR (n:Vault) REQUIRE n.vault_id IS UNIQUE;
CREATE CONSTRAINT Hook_id_unique IF NOT EXISTS FOR (n:Hook) REQUIRE n.hook_id IS UNIQUE;
CREATE CONSTRAINT Batch_id_unique IF NOT EXISTS FOR (n:Batch) REQUIRE n.batch_id IS UNIQUE;

// ----------------
// 3. Node Loading
// ----------------
// 3.1 Accounts
LOAD CSV WITH HEADERS FROM $account AS row
MERGE (a:Account {account_id: row.`account_id:ID(Account)`})
SET a.type = row.type,
    a.description = row.description,
    a.is_internal = toBoolean(row.is_internal);

// 3.2 Customers
LOAD CSV WITH HEADERS FROM $customer AS row
MERGE (c:Customer {customer_id: row.`customer_id:ID(Customer)`})
SET c.name = row.name,
    c.metadata = row.metadata;

// 3.3 Balances
LOAD CSV WITH HEADERS FROM $balance AS row
MERGE (b:Balance {balance_id: row.`balance_id:ID(Balance)`})
SET b.attributes = row.attributes,
    b.dimensions = row.dimensions;

// 3.4 Contracts
LOAD CSV WITH HEADERS FROM $smartContract AS row
MERGE (sc:Contract {contract_id: row.`contract_id:ID(Contract)`})
SET sc.name = row.name,
    sc.definition = row.definition,
    sc.characteristics = row.characteristics,
    sc.advantages = row.advantages,
    sc.disadvantages = row.disadvantages;

// 3.5 Products
LOAD CSV WITH HEADERS FROM $product AS row
MERGE (p:Product {product_id: row.`product_id:ID(Product)`})
SET p.name = row.name,
    p.description = row.description,
    p.metadata = row.metadata;

// 3.6 Product Versions
LOAD CSV WITH HEADERS FROM $productVersion AS row
MERGE (pv:ProductVersion {product_version_id: row.`product_version_id:ID(ProductVersion)`})
SET pv.version_code = row.version_code,
    pv.parameters = row.parameters,
    pv.supported_denominations = row.supported_denominations;

// 3.7 Components
LOAD CSV WITH HEADERS FROM $component AS row
MERGE (comp:Component {component_id: row.`component_id:ID(Component)`})
SET comp.name = row.name,
    comp.type = row.type,
    comp.description = row.description;

// 3.8 Vaults
LOAD CSV WITH HEADERS FROM $vault AS row
MERGE (v:Vault {vault_id: row.`vault_id:ID(Vault)`})
SET v.purpose = row.purpose,
    v.components = row.components;

// 3.9 Hooks
LOAD CSV WITH HEADERS FROM $hook AS row
MERGE (h:Hook {hook_id: row.`hook_id:ID(Hook)`})
SET h.name = row.name,
    h.function = row.function,
    h.description = row.description;

// 3.10 Batches
LOAD CSV WITH HEADERS FROM $postingInstructionBatch AS row
MERGE (b:Batch {batch_id: row.`batch_id:ID(Batch)`})
SET b.description = row.description,
    b.entries = row.entries;

// ----------------------
// 4. Relationship Loading (Hybrid Approach)
// ----------------------
// 4.1 Account Relationships
LOAD CSV WITH HEADERS FROM $associated_with AS row
MERGE (acc:Account {account_id: row.`account_id:START_ID(Account)`})
MERGE (cust:Customer {customer_id: row.`customer_id:END_ID(Customer)`})
MERGE (acc)-[:ASSOCIATED_WITH]->(cust);

LOAD CSV WITH HEADERS FROM $has_balance AS row
MERGE (acc:Account {account_id: row.`account_id:START_ID(Account)`})
MERGE (bal:Balance {balance_id: row.`balance_id:END_ID(Balance)`})
MERGE (acc)-[:HAS_BALANCE]->(bal);

LOAD CSV WITH HEADERS FROM $backed AS row
MERGE (acc:Account {account_id: row.`account_id:START_ID(Account)`})
MERGE (sc:Contract {contract_id: row.`contract_id:END_ID(Contract)`})
MERGE (acc)-[:BACKED_BY]->(sc);

// 4.2 Product Relationships
LOAD CSV WITH HEADERS FROM $defines AS row
MERGE (pv:ProductVersion {product_version_id: row.`product_version_id:START_ID(ProductVersion)`})
MERGE (sc:Contract {contract_id: row.`contract_id:END_ID(Contract)`})
MERGE (pv)-[:DEFINES]->(sc);

LOAD CSV WITH HEADERS FROM $uses AS row
MERGE (p:Product {product_id: row.`product_id:START_ID(Product)`})
MERGE (sc:Contract {contract_id: row.`contract_id:END_ID(Contract)`})
MERGE (p)-[:USES]->(sc);

LOAD CSV WITH HEADERS FROM $has_version AS row
MERGE (p:Product {product_id: row.`product_id:START_ID(Product)`})
MERGE (pv:ProductVersion {product_version_id: row.`product_version_id:END_ID(ProductVersion)`})
MERGE (p)-[:HAS_VERSION]->(pv);

// 4.3 System Relationships
LOAD CSV WITH HEADERS FROM $has_component AS row
MERGE (v:Vault {vault_id: row.`vault_id:START_ID(Vault)`})
MERGE (comp:Component {component_id: row.`component_id:END_ID(Component)`})
MERGE (v)-[:HAS_COMPONENT]->(comp);

LOAD CSV WITH HEADERS FROM $part_of AS row
MERGE (h:Hook {hook_id: row.`hook_id:START_ID(Hook)`})
MERGE (sc:Contract {contract_id: row.`contract_id:END_ID(Contract)`})
MERGE (h)-[:PART_OF]->(sc);

// --------------------------
// 5. Transaction Processing
// --------------------------
// 5.1 Batch-Account Linking
LOAD CSV WITH HEADERS FROM $postingInstructionBatch AS row
WITH row, split(row.entries, "; ") AS entries
UNWIND entries AS entry
WITH row, split(entry, ": ") AS parts
WHERE size(parts) = 2
MATCH (b:Batch {batch_id: row.`batch_id:ID(Batch)`})
MATCH (acc:Account {account_id: trim(parts[1])})
MERGE (b)-[:AFFECTS {type: trim(parts[0])}]->(acc);

// ----------------------
// 6. Index Optimization
// ----------------------
CREATE INDEX Account_type_idx FOR (a:Account) ON (a.type);
CREATE INDEX Product_category_idx FOR (p:Product) ON (p.metadata);
CREATE INDEX Contract_type_idx FOR (sc:Contract) ON (sc.characteristics);

// =============================================
// END OF IMPORT SCRIPT
// =============================================