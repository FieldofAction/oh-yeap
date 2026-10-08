# Case Study Block Types

Documentation for the case study component block system.

## New Block Types (v2)

### Impact Block

Display quantitative metrics and outcomes in a clean, metric-focused layout.

**Type:** `impact`

**Properties:**
- `label` (string, optional) - Section label (e.g., "Impact")
- `heading` (string, optional) - Section heading
- `metrics` (array) - Array of metric objects:
  - `value` (string) - The metric value (e.g., "28%", "3.2x")
  - `label` (string) - Metric label/title
  - `description` (string, optional) - Longer description of the metric
- `body` (string, optional) - Additional body text after metrics

**Example:**
```javascript
{
  type: "impact",
  label: "Impact",
  metrics: [
    {
      value: "28%",
      label: "Improved Navigation Clarity",
      description: "User testing showed a 28% improvement in understanding content categorization."
    },
    {
      value: "3.2x",
      label: "Design System Adoption",
      description: "Internal teams increased design system usage by 3.2x."
    }
  ]
}
```

**Visual Style:**
- Large, accent-colored values
- Clean typography without card backgrounds
- Responsive grid that adapts to mobile
- Numbers stand out prominently

---

### Augments Block

Explain design properties, techniques, or methodologies used in the project.

**Type:** `augments`

**Properties:**
- `label` (string, optional) - Section label
- `heading` (string, optional) - Section heading (e.g., "Augments", "Design Properties")
- `intro` (string, optional) - Introductory paragraph
- `items` (array) - Array of augment objects:
  - `title` (string) - Property/technique name
  - `body` (string) - Description (supports `\n\n` for paragraphs)
  - `src` (string, optional) - Image path
  - `alt` (string, optional) - Image alt text

**Example:**
```javascript
{
  type: "augments",
  label: "Design Properties",
  heading: "Augments",
  intro: "Design properties that enhanced the system's performance.",
  items: [
    {
      title: "Typological Clarity",
      body: "Each listening mode received distinct visual markers that signal intent before interaction. Typography, color temperature, and layout density work in concert."
    },
    {
      title: "Hierarchical Signals",
      body: "Content priority became legible through systematic application of scale, weight, and position."
    }
  ]
}
```

**Visual Style:**
- Clean, article-like layout
- Strong typography hierarchy
- Generous spacing between items
- Optional images for each augment

---

### Meta Block

Display clean project metadata in a grid layout.

**Type:** `meta`

**Properties:**
- `items` (array) - Array of metadata objects:
  - `label` (string) - Field label (e.g., "Client", "Timeline")
  - `value` (string) - Field value

**Example:**
```javascript
{
  type: "meta",
  items: [
    { label: "Client", value: "Apple" },
    { label: "Timeline", value: "2021–2025" },
    { label: "Team Size", value: "12 designers" },
    { label: "Platform", value: "iOS, macOS, Web" }
  ]
}
```

**Visual Style:**
- Flexible responsive grid
- Monospace labels for structured look
- Clean card background
- Adapts to mobile with single column

---

## Usage Guidelines

### When to Use Impact

Use the Impact block when you have:
- Quantitative metrics (percentages, multipliers, numbers)
- Clear business or design outcomes
- Measurable improvements or results

**Best Practices:**
- Keep metric values concise (e.g., "42%", "3.2x", not "approximately 42 percent")
- Use active language in descriptions
- Limit to 3-4 metrics per Impact block
- Place after Outcomes section for natural flow

### When to Use Augments

Use the Augments block when you want to:
- Explain design principles or properties
- Document technical or methodological approaches
- Describe systematic design decisions
- Showcase design system features

**Best Practices:**
- Keep titles short and descriptive (2-4 words)
- Write body text as clear, standalone explanations
- Use 3-5 augments per block
- Consider adding visuals for complex concepts
- Place near the end of the case study

### When to Use Meta

Use the Meta block when you need:
- Structured project information
- Quick reference facts
- Technical specifications
- Team or timeline details

**Best Practices:**
- Keep consistent label format across case studies
- Use short, scannable values
- Place early in the case study or in a sidebar
- Limit to 4-6 items for readability

---

## Existing Block Types Reference

For reference, here are the existing block types:

- `hero` - Hero image with variants (bleed, float, frame)
- `figure` - Single full-width image
- `two-up` - Two images side by side
- `three-up` - Three images in a row
- `section` - Section header with label
- `body` - Body text (supports markdown)
- `pull-quote` - Large pull quote text
- `sticky` - Text with scrolling images
- `split` - Text and image side by side
- `device` - Screenshot in device mockup
- `grid` - Multi-column image grid
- `triptych` - Three tall cards
- `atmosphere` - Floating content on gradient
- `collage` - Bento box layout
- `catalogue` - Collapsible index
- `plate` - Legible framed figure
- `plates` - Row of figures
- `diptych` - Screenshot + architecture
- `fourfold` - Method diagram
- `video` - Video embed
- `intervention` - 3-column intervention grid
- `reframe` - Thesis + body
- `insight` - Closing insights

---

## Migration Notes

### From Previous Format

If you have existing case studies using the old format, the new blocks are additive and don't break existing layouts. You can gradually add Impact and Augments blocks to enhance your case studies.

### Collins-Style Case Studies

To create Collins-style case studies:
1. Use clean `section` labels
2. Add `augments` block to explain design properties
3. Include `impact` block with metrics
4. Use `pull-quote` blocks for key statements
5. End with `insight` block

### Spangler-Style Case Studies

To create Spangler-style minimalist case studies:
1. Keep `meta` block simple and early
2. Use body text for narrative
3. Minimal images, focus on typography
4. Single-column flow with clean spacing
