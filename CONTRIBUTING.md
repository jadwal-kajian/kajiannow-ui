# Contributing to KajianNow

First off, thank you for taking the time to contribute! 🎉 KajianNow is built
for the community, and every contribution — whether it's a bug report, a new
feature, or a documentation fix — is genuinely appreciated.

## Ways to contribute

- 🐛 **Report bugs** — open an issue describing what went wrong and how to reproduce it.
- 💡 **Suggest features** — open an issue describing the idea and the problem it solves.
- 📝 **Improve documentation** — typos, clarifications, and examples are always welcome.
- 🔧 **Submit code** — fix a bug or build a feature via a pull request.

## Getting set up

1. Fork the repository and clone your fork.
2. Install dependencies and set up your environment:
   ```sh
   npm install
   cp .env.example .env   # fill in the values (see README.md)
   ```
3. Start the dev server:
   ```sh
   npm run dev
   ```

See the [README](README.md) for the full list of environment variables and scripts.

## Development workflow

1. Create a branch off the default branch. Use a short, descriptive name:
   - `feat/nearby-sheet` for features
   - `fix/marker-badge` for bug fixes
   - `docs/readme` for documentation
2. Make your changes in focused, logical commits.
3. Before opening a pull request, make sure everything passes locally:
   ```sh
   npm run lint        # no ESLint errors
   npm run build       # builds successfully
   npm run test:e2e    # end-to-end tests pass
   ```

## Commit messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/)
style. Format your commit subject as:

```
<type>(<scope>): <short description>
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

Examples from this project:

```
feat(preview): draggable Google-Maps-style bottom sheet for nearby kajian
fix(preview): keep multi-kajian count badge above neighboring pins
feat(notifications): route notification clicks to the user's preferred UI
```

Keep the subject line under ~72 characters and in the imperative mood.

## Pull requests

1. Push your branch to your fork and open a pull request against the default branch.
2. Fill in the pull request description:
   - **What** the change does and **why**.
   - Screenshots or screen recordings for any UI change.
   - Reference any related issues (e.g. `Closes #123`).
3. Make sure lint, build, and E2E tests pass.
4. A maintainer will review your PR. Please be responsive to feedback — small
   follow-up commits are fine; we squash on merge.

## Code style

- The project uses **ESLint** — run `npm run lint` and fix any reported issues.
- Follow the existing patterns and structure in the codebase.
- Prefer small, focused components and keep styling with **Tailwind** utility classes,
  consistent with the surrounding code.

## Reporting security issues

Please **do not** open public issues for security vulnerabilities. Instead,
report them privately to the maintainers so they can be addressed responsibly.

## License

By contributing, you agree that your contributions will be licensed under the
[MIT License](LICENSE) that covers this project.
