# 0xBUFF Skills

Skills that help AI coding agents use 0xBUFF tools correctly. Each skill includes the instructions and examples needed to get started.

## Throughline

Use Throughline to show how a value, algorithm, or process changes step by step. The skill helps an agent:

- Write valid `thl` diagrams in Markdown.
- Choose the right visualization for variables, binary addition, matrix multiplication, recursion, and custom workflows.
- Add interactive players to React, Next.js, or Markdown/MDX documentation.
- Style the player and fix common errors.
- Check that the result works as intended.

### Install

~~~sh
npx skills add https://github.com/0xbuffdev/skills --skill throughline
~~~

The skill guides your coding agent. To run Throughline in your application, install its package separately:

~~~sh
npm install @0xbuff/throughline
~~~

For the interactive player, React 19 and React DOM 19 are also required.

See the [Throughline skill](skills/throughline/SKILL.md) for examples and supported features.
