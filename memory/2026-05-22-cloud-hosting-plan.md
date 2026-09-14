# Cloud Hosting Tier Plan — ClawStudio/AgentSocial

**Date**: 2026-05-22
**Status**: Draft — Ready for Review
**Author**: AgentSocial-CEO

---

## 1. Why Cloud Hosting

Most salon/small biz owners won't buy a $500+ mini PC. Cloud hosting removes the hardware barrier and gives us:

- **Recurring revenue** on top of SaaS subscription
- **Full control** over the environment (no "it doesn't work on my laptop" support)
- **Easier onboarding** — signup → we provision → they're live
- **Lock-in** — harder to leave when we host everything

---

## 2. Service Tiers

### Self-Hosted (Free — Software Only)
- Customer provides hardware (mini PC, VPS, etc.)
- We provide install scripts + docs
- Community support only
- Best for: tech-savvy users, existing infrastructure

### Cloud Basic — $49/mo
- Dedicated 4GB VPS (Hetzner)
- AgentSocial API + Web
- Dograh Voice Agent (up to 25 calls/day)
- 10GB storage
- Email support
- Best for: solo salons, small businesses

### Cloud Pro — $99/mo
- Dedicated 8GB VPS (Hetzner)
- AgentSocial API + Web
- Dograh Voice Agent (up to 100 calls/day)
- 50GB storage
- QMD memory system
- Daily backups
- Priority email support
- Best for: multi-stylist salons

### Cloud Managed — $149/mo
- Dedicated 8GB VPS (Hetzner)
- Everything in Cloud Pro
- We handle all updates, monitoring, fixes
- Custom domain + SSL
- 24/7 monitoring + alerting
- Dedicated Slack/Signal channel for support
- Best for: non-technical owners who want zero worry

---

## 3. Infrastructure Architecture

```
Customer Signup (clawstudio.co)
        │
        ▼
Provisioning API (our server)
        │
        ├──► Hetzner Cloud API → Create VPS
        ├──► Ansible/Terraform → Install stack
        ├──► Dograh → Configure voice agent
        ├──► AgentSocial → Create account + API keys
        └──► DNS → Point subdomain.clawstudio.co
        │
        ▼
Customer Live Instance (subdomain.clawstudio.co)
```

### Stack per Instance

| Service | RAM | Purpose |
|---------|-----|---------|
| OpenClaw Gateway | 512MB | Agent orchestrator |
| AgentSocial API | 256MB | Backend (Node.js) |
| AgentSocial Web | 256MB | Frontend (Next.js) |
| Dograh Server | 512MB | Voice agent API |
| Dograh UI | 128MB | Voice agent dashboard |
| QMD | 1GB | Memory/search (Pro+ only) |
| PostgreSQL | 256MB | Primary DB |
| Redis | 128MB | Caching/queues |
| Nginx | 64MB | Reverse proxy + SSL |
| **Total Basic** | **~2GB** | |
| **Total Pro** | **~3.5GB** | With QMD |

---

## 4. Voice Agent Costs (per client)

| Component | Cost | Notes |
|-----------|------|-------|
| Deepgram STT | $0.005/min | Speech-to-text |
| GPT-4o-mini | $0.15/1K tokens | Conversation |
| ElevenLabs TTS | $3/1K chars | Text-to-speech |
| Twilio phone | $1.15/mo + $0.0085/min | Phone number |

### Monthly Cost Scenarios

| Calls/Day | Avg Duration | Voice API Cost | Twilio Cost | Total Voice |
|-----------|-------------|---------------|-------------|-------------|
| 25 | 2 min | ~$8 | ~$6 | ~$14 |
| 50 | 2 min | ~$16 | ~$12 | ~$28 |
| 100 | 2 min | ~$32 | ~$24 | ~$56 |

---

## 5. Unit Economics

| Cost Item | Basic | Pro | Managed |
|-----------|-------|-----|---------|
| VPS (Hetzner) | $7 | $14 | $14 |
| Voice APIs (avg) | $14 | $28 | $28 |
| LLM (content gen) | $5 | $8 | $8 |
| Backups | $0 | $2 | $2 |
| Monitoring | $0 | $0 | $3 |
| Support time | $2 | $5 | $15 |
| **Total Cost** | **$28** | **$57** | **$70** |
| **Price** | **$49** | **$99** | **$149** |
| **Margin** | **$21** | **$42** | **$79** |
| **Margin %** | **43%** | **42%** | **53%** |

### Revenue Projections

| Clients | Basic Rev | Pro Rev | Managed Rev | Total Margin |
|---------|-----------|---------|-------------|-------------|
| 10 | $490 | $990 | $1,490 | $1,420/mo |
| 25 | $1,225 | $2,475 | $3,725 | $3,550/mo |
| 50 | $2,450 | $4,950 | $7,450 | $7,100/mo |
| 100 | $4,900 | $9,900 | $14,900 | $14,200/mo |

Mixed model assumes 1/3 each tier.

---

## 6. Provisioning Flow

1. **Customer signs up** on clawstudio.co
2. **Payment processed** via Square (already integrated)
3. **Provisioning triggered**:
   - Create Hetzner VPS via API
   - Run Ansible playbook to install full stack
   - Configure Dograh with salon template
   - Create AgentSocial account + generate API keys
   - Assign subdomain (e.g., pleij.clawstudio.co)
   - Configure SSL via Let's Encrypt
4. **Welcome email** with login details + onboarding link
5. **Monitoring enabled** (Uptime check + resource alerts)

### Provisioning Time: ~15-20 minutes automated

---

## 7. Provider: Hetzner Cloud

### Why Hetzner
- Cheapest quality VPS: $7/mo for 4GB (vs DigitalOcean $24, AWS $30+)
- EU + US data centers (Ashburn, VA for US clients)
- Excellent API for automation
- Snapshot backups included
- 99.95% SLA

### VPS Specs

| Tier | Hetzner Type | vCPU | RAM | Disk | Price |
|------|-------------|------|-----|------|-------|
| Basic | CX22 | 2 | 4GB | 40GB | €5.83 (~$7) |
| Pro/Managed | CX32 | 4 | 8GB | 80GB | €11.73 (~$14) |

---

## 8. Management Tooling

| Tool | Purpose |
|------|---------|
| Ansible | Provisioning + config management |
| Terraform | Infrastructure as code (optional) |
| Hetzner Cloud API | VPS lifecycle |
| OpenClaw | Remote agent management |
| UptimeRobot | Monitoring (free tier) |
| Grafana/Prometheus | Metrics (Pro+ only) |

---

## 9. Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Hetzner account + API key
- [ ] Ansible playbook for full stack install
- [ ] Provisioning API endpoint (create/destroy instance)
- [ ] Subdomain DNS automation (wildcard *.clawstudio.co)
- [ ] SSL auto-provisioning (Let's Encrypt)

### Phase 2: Productize (Week 3-4)
- [ ] Signup flow on clawstudio.co
- [ ] Square billing for hosting tiers
- [ ] Customer dashboard (instance status, usage, reboot)
- [ ] Monitoring + alerting
- [ ] Automated daily backups

### Phase 3: Scale (Month 2+)
- [ ] Auto-scaling (upgrade VPS tier on demand)
- [ ] Multi-location support (one VPS per location)
- [ ] White-label option (custom domain)
- [ ] Usage-based pricing for voice minutes
- [ ] Customer self-service portal

---

## 10. Risk & Mitigations

| Risk | Mitigation |
|------|-----------|
| Hetzner outage | Multi-provider failover (DO as backup) |
| Voice API costs spike | Hard caps per tier + overage billing |
| Customer data loss | Daily automated backups + retention |
| Support overload | Managed tier funds dedicated support |
| VPS compromise | Firewall, SSH keys only, auto-updates |

---

## Next Steps

1. Jason creates Hetzner Cloud account
2. Build Ansible playbook from existing install scripts
3. Set up wildcard DNS for *.clawstudio.co
4. Build provisioning API
5. Test end-to-end: signup → provision → live in <20 min