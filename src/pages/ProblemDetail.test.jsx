import { renderMarkdown } from "./ProblemDetail";

describe("ProblemDetail markdown rendering", () => {
  test("renders Markdown, inline LaTeX, and display LaTeX", () => {
    const { __html } = renderMarkdown([
      "## Formula",
      "",
      "Inline formula: $x^2 + y^2 = z^2$ and \\(a + b = c\\).",
      "",
      "$$",
      "\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}",
      "$$",
      "",
      "\\[a^2 + b^2 = c^2\\]"
    ].join("\n"));

    expect(__html).toContain("<h2>Formula</h2>");
    expect(__html).toContain('class="katex"');
    expect(__html.match(/class="katex-display"/g)).toHaveLength(2);
    expect(__html).not.toContain("<script>");
  });
});
