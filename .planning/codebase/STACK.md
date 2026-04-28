---
mapped_date: 2026-04-28
---
# Tech Stack

## Overview
ARESWEB is a modern full-stack web application leveraging Cloudflare's serverless ecosystem.

## Core Stack
- **Frontend Framework:** React 18 with Vite
- **Backend Framework:** Hono 4.7
- **Language:** TypeScript 5
- **Routing:** React Router (Frontend) / Hono (Backend)
- **API Contract:** ts-rest (`@ts-rest/core`, `@ts-rest/react-query`, `ts-rest-hono`)
- **Database:** Cloudflare D1
- **ORM/Query Builder:** Kysely 0.28 with `kysely-d1` and `kysely-codegen`

## Key Libraries
- **Styling:** TailwindCSS 3.4
- **State Management:** Zustand 5.0, TanStack React Query 5
- **UI Components:** Radix UI, Tremor, Lucide React
- **Rich Text Editing:** TipTap 3.22 (with custom Mermaid extension)
- **Authentication:** Better-Auth 1.6
- **Forms/Validation:** React Hook Form, Zod 4.3

## Rationale
- The use of **Cloudflare Pages/Workers** provides edge deployment with low latency and tight integration with D1.
- **Hono** is highly optimized for Cloudflare Workers.
- **ts-rest** ensures strict end-to-end type safety between the frontend and backend without requiring GraphQL.
