# 0xBUFF Agent Skills

A collection of self-contained [Agent Skills](https://agentskills.io) for building with 0xBUFF technologies. Each skill supplies the instructions, working examples, and local resources needed by a coding agent. Skills are installed individually from this repository.

## Skills

| Skill | Purpose | Install |
| --- | --- | --- |
| [Throughline](skills/throughline/SKILL.md) | Author, compile, validate, and embed step-by-step Throughline visualizations. | `npx skills add https://github.com/0xbuffdev/skills --skill throughline` |

### Throughline

Install the skill for your coding agent:

```sh
npx skills add https://github.com/0xbuffdev/skills --skill throughline
```

In projects that use Throughline, install its runtime separately:

```sh
npm install @0xbuff/throughline
```

The skill targets `@0xbuff/throughline@0.0.2`; the interactive player additionally requires React 19 and React DOM 19. Its bundled examples, reference guides, and validation script are under [`skills/throughline/`](skills/throughline/SKILL.md).

## Repository layout

```text
.
├── AGENTS.md                 # Repository-wide instructions
├── README.md                 # Human-readable skill catalog
├── skills/
│   └── throughline/
│       ├── SKILL.md          # Required skill entry point
│       ├── references/       # Detailed usage guides, read as needed
│       ├── scripts/          # Reusable validation helper
│       └── assets/           # Complete runnable diagrams
├── evals/                    # Task scenarios for individual skills
├── scripts/                  # Repository-level quality checks
└── .github/workflows/        # CI checks and installation tests
```

Future skills belong in `skills/<skill-name>/` with their own `SKILL.md`. Add only the `references/`, `scripts/`, or `assets/` directories that the skill actually needs. Do not place another skill's supporting resources in a shared folder.

## Versioning

Each skill has an **independent semantic version** in the quoted `metadata.version` field of its `SKILL.md`. A change inside a skill directory requires a version increase. The repository's version check enforces this in pull requests.

After a release is reviewed and merged, a tag such as `throughline-v0.3.0` may be created for the corresponding released skill version. To install a tagged revision once that tag exists:

```sh
npx skills add 0xbuffdev/skills@throughline-v0.3.0 --skill throughline
```

A tag in these examples is a naming convention, not a claim that it has been published.

## Contributing

Read [`AGENTS.md`](AGENTS.md) before changing the repository. Changes go through a dedicated branch and pull request. The general checks validate every skill; domain-specific smoke checks verify working examples where an executable runtime exists.
