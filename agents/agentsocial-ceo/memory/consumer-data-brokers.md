# Consumer Data Brokers — TaskLinkr

## B2C vs B2B Data Markets

| | B2B Data | B2C (Consumer) Data |
|--|----------|---------------------|
| **Who** | Businesses, professionals | Consumers, households |
| **Data types** | Work email, LinkedIn, company | Cell phone, home address, income |
| **Use case** | B2B sales, recruiting | Marketing, political, B2C sales |
| **Pricing** | Per contact ($0.06-$0.15) | Per record ($0.001-$0.15) |
| **Regulation** | GDPR, CCPA, CAN-SPAM | TCPA, GDPR, stricter consent |
| **Quality metric** | Job title accuracy, email deliverability | Phone connect rate, demographic accuracy |

---

## Consumer Data Broker Landscape

### Tier 1: High Volume, Quality Filters

| Provider | Records | Pricing | Key Feature |
|----------|---------|---------|-------------|
| **BigDBM** | 765M+ US phones | Contact for pricing | PQL scoring (deliverability), income filters |
| **Data Axle** | 250M+ consumers | $79-209/mo or $3.2K-150K/yr | Clean data, household filters, established |
| **AccuData** | Large consumer base | Custom | Wealth indicators, luxury purchase behavior |

### Tier 2: Budget Options

| Provider | Pricing | Best For |
|----------|---------|----------|
| **DataToLeads** | $0.001/record | Bulk purchases, cost-conscious |

### Pricing Benchmarks

| Data Type | Price per Record | Minimum Order |
|-----------|------------------|-----------------|
| Bulk consumer (basic) | $0.001-$0.05 | $500-$1,000 |
| Income-filtered | $0.03-$0.15 | $1,000+ |
| High-net-worth | $0.10-$0.50 | $5,000+ |
| Cell phone verified | $0.05-$0.25 | $2,000+ |

---

## TaskLinkr Integration

### Consumer Data Use Cases for AI Agents

**Marketing Agent:**
- "Find 10,000 homeowners with $150K+ income in Austin metro"
- Negotiates: $0.03/record, 85% phone accuracy, fresh within 90 days

**Political Campaign Agent:**
- "Get cell phones for registered voters aged 25-45 in swing districts"
- Negotiates: $0.02/record, DNC scrubbed, opt-in verified

**Real Estate Agent:**
- "High-net-worth individuals looking to buy second homes"
- Negotiates: $0.15/record, wealth indicators, recent credit activity

### Compliance Layer

**Critical for consumer data:**
- ✅ TCPA compliance (telemarketing consent)
- ✅ DNC list scrubbing
- ✅ State privacy laws (CCPA, etc.)
- ✅ Opt-out handling
- ✅ Data retention limits

**TaskLinkr adds:**
- Compliance verification per broker
- Automatic DNC scrubbing
- Audit trails for regulatory defense
- Dispute resolution

---

## Broker Comparison Matrix

| Feature | BigDBM | Data Axle | DataToLeads |
|---------|--------|-----------|-------------|
| **Cell phones** | ✅ 765M+ | ✅ Large | ✅ Basic |
| **Income filtering** | ✅ Advanced | ✅ Good | ❌ Limited |
| **PQL scoring** | ✅ Proprietary | ❌ No | ❌ No |
| **Price/record** | $0.05-$0.15 | $0.03-$0.10 | $0.001 |
| **API** | ✅ Yes | ✅ Yes | ❌ Manual |
| **Minimum order** | $1,000+ | $500+ | $100 |

---

## Recommended First Integration

**BigDBM** — Why:
- Largest US phone database
- PQL scoring = quality differentiation
- Income filters for high-value targeting
- API-first (not manual downloads)

**Alternative:** Data Axle — More established, better for conservative buyers

---

## A2A Negotiation for Consumer Data

**Agent Request:**
```json
{
  "type": "consumer_data_request",
  "segment": "homeowners",
  "filters": {
    "income_min": 150000,
    "location": "Austin, TX metro",
    "age_range": "35-55"
  },
  "volume": 10000,
  "data_types": ["cell_phone", "email"],
  "compliance": ["TCPA", "DNC_scrubbed"]
}
```

**Broker Responses:**
- BigDBM: "10K records @ $0.08/record, 88% PQL, income verified"
- Data Axle: "10K records @ $0.06/record, 82% accuracy"
- DataToLeads: "10K records @ $0.015/record, no quality guarantee"

**Negotiation:** Multi-round on price, accuracy guarantees, replacement policy

---

## Risk Considerations

| Risk | Mitigation |
|------|------------|
| TCPA lawsuits | TaskLinkr verifies consent, handles DNC |
| Data quality disputes | Replacement/refund policy via TaskLinkr |
| Privacy regulations | Compliance layer per jurisdiction |
| Broker reliability | TaskLinkr escrow, reputation system |

---

## Next Steps

1. **Research BigDBM API** — Technical integration
2. **Legal review** — TCPA, state privacy law compliance
3. **Pilot with marketing agents** — Test demand
4. **Build compliance layer** — DNC scrubbing, consent verification

**Estimated MVP:** 4-6 weeks (including compliance)
