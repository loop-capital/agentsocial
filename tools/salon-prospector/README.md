# Salon Prospector for AgentSocial

## Overview
Finds salons and beauty professionals with weak websites, generates preview sites, and converts them to AgentSocial customers.

## Pipeline
1. **Discover** — Find salons in target city with weak websites
2. **Qualify** — Verify they need a website upgrade
3. **Generate** — Build preview salon website
4. **Deploy** — Host on Vercel
5. **Outreach** — Contact with preview + AgentSocial offer

## Target Industries
- Hair salons, Nail salons, Spas
- Makeup artists, Personal trainers, Estheticians

## Usage
```bash
npm install
node prospect.js --city "Columbus, OH" --industry "hair salon" --count 5
node deploy.js
node outreach.js
```
