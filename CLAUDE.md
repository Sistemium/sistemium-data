# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

sistemium-data is a TypeScript data layer library that provides data modeling and caching capabilities with HTTP API integration. It's designed as a foundational library for data management in JavaScript/TypeScript applications.

## Development Commands

```bash
# Build the project (compiles TypeScript to lib/)
npm run build

# Run tests
npm test

# Run tests with coverage
npm run coverage

# Watch mode for development
npm run watch
```

## Architecture

### Core Components

1. **Model** (`src/Model.ts`): Base class for data models with HTTP API operations
   - Handles CRUD operations via axios
   - Supports schema definitions and validation
   - Plugin system via `IModelPlugin` interface
   - Operations: CREATE, UPDATE, FIND_ONE, FIND_MANY, DELETE_ONE, MERGE, AGGREGATE

2. **CachedModel** (`src/CachedModel.ts`): Extends Model with in-memory caching
   - Primary index (`byId`), secondary indices (`secondaryIndices`), and one-to-many relationships (`oneToManyIndices`)
   - Predicate-based querying with cache optimization
   - Cache management methods: `eject()`, `clear()`

3. **StoreAdapter** (`src/StoreAdapter.ts`): Registry pattern for managing multiple models
   - `getStoreModel()`: Returns or creates a model instance
   - `getStoreModelIfExists()`: Returns existing model or undefined
   - Manages model configurations and ID properties

### Key Patterns

- **HTTP Operations**: All API calls go through axios configured in `src/util/axios.ts`
- **Caching Strategy**: CachedModel maintains multiple indices for efficient lookups
- **Plugin Architecture**: Models can be extended via plugins (e.g., CommonFieldsPlugin)
- **Predicate System**: Query matching uses predicate functions in `src/util/predicates.ts`

## Testing

Tests use Mocha with Chai assertions and mock axios adapters:

- Model tests: `test/testModel.ts`
- CachedModel tests: `test/testCachedModel.ts`
- StoreAdapter tests: `test/testAdapters.ts`

Run a single test file:

```bash
npx ts-mocha test/testModel.ts --exit
```

## TypeScript Configuration

- Target: ES2020, CommonJS modules
- Strict mode enabled
- Output directory: `lib/`
- Source maps enabled
- All strict type checking flags enabled

## Code Style

- 2-space indentation
- UTF-8 encoding
- LF line endings
- No trailing whitespace
