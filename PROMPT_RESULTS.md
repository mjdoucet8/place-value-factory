# Prompt Results Log

This document records each user request in brief and the resulting implementation status. New entries are appended after each implementation prompt.

## 2026-09-19 — Initial Place Value Factory V1 implementation request

Result: Established the TypeScript workspace, shared contracts, pure mathematical engine, minimum-crate logic, deterministic generation, independent oracle, fixture tests, fictional API, persisted development store, and semantic React slice. Math tests, type-check, build, and a five-order API flow passed. Full production authentication, PostgreSQL, advanced UI, and classroom QA remain incomplete.

## 2026-09-19 — Local test environment commands

Result: Documented `npm install`, `npm run dev`, local URLs, and fictional student/teacher credentials.

## 2026-09-19 — Student and teacher login returned “Failed to fetch”

Result: Diagnosed a local Vite/API port and CORS mismatch. Stabilized the web port at 5181 and made local CORS permissive for the development adapter.

## 2026-09-19 — Difficulty implementation was missing

Result: Added configuration-backed Level 1 difficulty bands, deterministic band selection, server-persisted issued bands, and visible difficulty labels. Extended the progression foundation to all 30 configured levels with solvability tests.

## 2026-09-19 — Level 2 did not unlock the next level

Result: Refreshed the authoritative map snapshot when returning from results. The API correctly reports completed earlier levels and unlocks the next level.

## 2026-09-19 — Typed numbers retained the initial zero

Result: Quantity fields now select an initial zero on focus so typed values replace it.

## 2026-09-19 — Enter should ship an order

Result: Enter in a quantity field now submits the current order, in addition to the Ship Order button.

## 2026-09-19 — Shift navigation between quantity boxes

Result: Added Shift-to-next and Shift+Tab-to-previous quantity navigation, then removed plus/minus buttons from the tab sequence so fields can be reached directly.

## 2026-09-19 — Focus the 100,000 box on new levels and new problems

Result: The first quantity field is programmatically focused when a level opens and whenever a new order is issued after shipping.

## 2026-09-19 — End mission option

Result: Added End Mission, which returns to the refreshed map while preserving the active server-side attempt.

## 2026-09-19 — Maintain this prompt/results document

Result: Created this running log. Future implementation prompts should append a dated brief summary here.
