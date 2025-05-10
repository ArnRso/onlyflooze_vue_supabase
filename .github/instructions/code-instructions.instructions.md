---
applyTo: '**'
---

Coding standards, domain knowledge, and preferences that AI should follow.

## Coding standards

- Use TypeScript wherever possible.
- Prefer Vue 3 Composition API syntax (`setup()`, `ref`, `computed`, etc.).
- Vue file naming: `MyComponent.vue` (PascalCase).
- TypeScript file naming: `myFile.ts` (camelCase or PascalCase as appropriate).
- Indentation: 2 spaces, no tabs.
- Maximum line length: 100 characters.
- Use single quotes `'` except in JSON files.
- Always end statements with a semicolon `;`.
- Use explicit imports, never wildcard imports (`import * as ...`).
- Prefer pure functions and functional programming when relevant.

## Best practices

- Comment complex or non-trivial code.
- Factor reusable code into `src/components` or `src/services`.
- Use custom hooks in `src/queries` for Supabase-related logic.
- Handle client-side errors and display clear error messages to users.
- Never commit secrets or API keys to the repository.
- Prefer `async/await` for promise handling.
- Respect the existing folder structure.

## Clean Code

- Writing clean, readable, and maintainable code is extremely important for this project.
- Code should be self-explanatory: use meaningful variable, function, and component names.
- Avoid code duplication; always refactor repeated logic into reusable functions or components.
- Keep functions and components small and focused on a single responsibility.
- Remove dead code and unnecessary comments.
- Favor clarity over cleverness: prioritize code that is easy to understand for others (and your future self).
- Regularly review and refactor code to maintain high quality standards.

## Test-Driven Development (TDD)

- TDD is a core practice for this project: all new development must be covered by TDD.
- Always write a failing test before implementing new features or fixing bugs.
- Follow the Red-Green-Refactor cycle: write a failing test, write just enough code to pass, then refactor.
- Ensure all new code is covered by tests and that tests are clear, isolated, and meaningful.

## Tests

- Tests must use, as much as possible, the types exported by the application (especially those from `src/types/supabase.ts`) to ensure type consistency between production code and tests.
- Tests must be clear, isolated, and meaningful.
- Respect the existing folder structure to organize test files.
- Document public test functions or hooks when necessary.

## Git & Documentation

- Commit messages must be clear and concise, preferably in French.
- Document every public function or component with a JSDoc comment.

## Project specifics

- Use Supabase for authentication and data management.
- Make maximum use of the exported types from the `src/types/supabase.ts` file for all Supabase-related data (queries, mutations, entities, etc.).
- Use TanStack Query (Vue Query) for data fetching, caching, and synchronization with Supabase.
- Follow business logic defined in existing services and queries.
- Prefer the use of reusable UI components.
