import next from "eslint-config-next";

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [".worktrees/**"],
  },
  ...next,
];

export default eslintConfig;
