---
description: Inline alert surface for status, warning, and informational messages.
tags: [shadcn-vue, alert, status]
---

# Alert

Use `Alert` for inline messaging that should remain in the document flow.

## When to Use

- Success, warning, and error callouts
- Inline page or section status messaging

## Built From

- Custom styled alert container and description/title parts

## What Shadcn Adds

- Variants for normal and destructive states plus structured content slots

## Installation

```bash
pnpm dlx shadcn-vue@latest add alert
```

## Example Patterns

- Vanilla: title plus description alert
- Contextual: form error banner or onboarding callout

## Official Docs Example Coverage

- `Success alert`: icon, title, and description in the default variant.
- `Title-only alert`: icon-led callout without extra body copy.
- `Destructive alert`: payment or failure messaging with follow-up bullet points.

## Practical Notes

- The official examples keep alerts inline and content-first. Use them for messages that should remain part of the page flow.
- Move to `AlertDialog` when the user must respond before continuing.
